import { InstructionInformation, Instructions, PUSHABLE_STATE, RegisterKey, REGISTERS} from "./Registers.ts"
import {createMemory, MemoryMapper} from "./Memory.ts"
import { drawLine, getNeighboringPixelIndex, indexByCoordinates } from "../utils/coordinates.ts";
import { ImageData } from "../interfaces/Image.ts";
import { combineRGB, modifyLuminosity, spreadRGB } from "../utils/color.ts";
import { U255 } from "../interfaces/RGBA.ts";
import { DecodedFile } from "../interfaces/FileShape.ts";
import { sleep } from "../utils/timing.ts";
import { seeds } from "../utils/misc.ts";
import { Direction } from "../interfaces/Actions.ts";

const INSTRUCTION_LENGTH_IN_BYTES = 4;
const PLANK = INSTRUCTION_LENGTH_IN_BYTES == 4 ? 0x7FFFFFFF : 0xffff;

export default class IDGVM {
  // TODO: flushState(); -> flushes memory and other info to the idg file for hard storage. (probably should be a module)

  private registers: DataView;
  private memory: MemoryMapper;
  private registerMap: Record<RegisterKey, number>;
  private interruptVectorAddress: number;
  private isInInterruptHandler: boolean;
  private stackFrameSize: number;

  /**
   * Indicates how many empty instructions we saw after each other..
   */
  private emptyInstructionAtStep = 0;

  // Image specific stuff
  /**
   * Copy of the image to modify.
   */
  public imageCopy: number[];
  /** The image itself */
  public image: ImageData;
  /**
   * Callback that is executed when a render request has been made
   */
  private imageRenderCB: (newImage: number[])=>void;

  private allocatedAmount: number;
  private halt = false;

  private IPStack: number[] = []
  
  /**
   * 
   * @param memory Refers to the allocated memory available to our system
   * @param interruptVectorAddress 
   */
  constructor(memory: MemoryMapper, loadedFile: DecodedFile, interruptVectorAddress = 0x249F0) {
    this.memory = memory;
    this.image = {imageData: loadedFile.image, width: loadedFile.imageWidth, height: loadedFile.imageHeight};
    this.imageCopy = [...this.image.imageData];
    this.imageRenderCB = ()=>{};
    this.allocatedAmount = loadedFile.memoryRequest;

    /**
     * Creating memory for actual values of register
     * System is currently 16-bits so that's 2 bytes for each register
     * 
     * I don't think i'll care about the size of this needing to be smaller as this
     * will never get dumped to disk anyways..
     */
    this.registers = createMemory(REGISTERS.length * INSTRUCTION_LENGTH_IN_BYTES);
    /**
     * Defining where in the registers (defined above) the values
     * in the map will be pointing to.
     */
    this.registerMap = REGISTERS.reduce((map, name, i) => {
      // multiply by 2 to make sure that the offsets do not overlap one another
      map[name] = i * INSTRUCTION_LENGTH_IN_BYTES;
      return map;
    }, {} as Record<string, number>);

    this.interruptVectorAddress = interruptVectorAddress;
    this.isInInterruptHandler = false;
    this.setRegister('im', this.allocatedAmount);

    this.setRegister('sp', this.allocatedAmount  - loadedFile.stackSizeRequirement);
    this.setRegister('fp', this.allocatedAmount  - loadedFile.stackSizeRequirement);

    this.stackFrameSize = 0;
  }

  debug() {
    for(const name in this.registerMap){
      try{
        // console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(8, '0')} -> ${this.getRegister(name)}`);
        console.log(`${name}: ${this.getRegister(name as RegisterKey).toString().padStart(3, "0")}`);
      }catch(e){
        console.error("Potential empty stack (did you forget to add instructions?)", e);
      }
    }
    console.log();
  }

  onImageRenderRequest(cb: (newImageData: number[])=>void){
    this.imageRenderCB = cb;
  }

  /**
   * Replace the active image with the image copy and then execute the callback method
   */
  private render(){
    this.image.imageData = [...this.imageCopy];
    this.imageRenderCB(this.image.imageData);
  }

  viewMemoryAt(address: number, n = 8) {
    // 0x0f01: 0x04 0x05 0xA3 0xFE 0x13 0x0D 0x44 0x0F ...
    const nextNBytes = Array.from({length: n}, (_, i) =>
      this.memory.getUint8(address + i)
    ).map(v => `0x${v.toString(16).padStart(2, '0')}`);

    console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextNBytes.join(' ')}`);
  }

  /**
   * @returns the data of a register.. 
   */
  getRegister(name: RegisterKey) {
    if (!(name in this.registerMap)) {
      throw new Error(`getRegister: No such register '${name}'`);
    }
    return this.registers.getUint32(this.registerMap[name]);
  }

  setRegister(name: RegisterKey, value: number) {
    if (!(name in this.registerMap)) {
      throw new Error(`setRegister: No such register '${name}'`);
    }
    return this.registers.setUint32(this.registerMap[name], value);
  }

  /**
   * Fetches the current instruction to be returned and increments the instruction pointer
   * to the next address to be executed next
   * @returns an executable instruction
   */
  fetchCurrentInstruction8() {
    // get the instruction pointer address that houses the next instruction
    const nextInstructionAddress = this.getRegister('ip');
    // gets the actual instruction value from that location in memory
    if(nextInstructionAddress + 1 > this.allocatedAmount){
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getUint8(nextInstructionAddress);
    // increment the program counter (instruction pointer) to the next instruction.
    this.setRegister('ip', nextInstructionAddress + 1);
    return instruction;
  }
  //TODO: fetch instruction methods for signed integers

  fetchCurrentInstruction16() {
    const nextInstructionAddress = this.getRegister('ip');
    const instruction = this.memory.getUint16(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 2);
    return instruction;
  }

  fetchCurrentInstruction32() {
    const nextInstructionAddress = this.getRegister('ip');
    const instruction = this.memory.getUint32(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 4);
    return instruction;
  }

  push(value: number) {
    // TODO: extract the stack in it's own memory to avoid overlap
    const spAddress = this.getRegister('sp');
    this.memory.setUint32(spAddress, value);
    this.setRegister('sp', spAddress - INSTRUCTION_LENGTH_IN_BYTES); // moving stack pointer down
    this.stackFrameSize += INSTRUCTION_LENGTH_IN_BYTES;
  }

  // TODO: extract the stack in it's own memory to avoid overlap
  pop() {
    const nextSpAddress = this.getRegister('sp') + INSTRUCTION_LENGTH_IN_BYTES;
    
    this.setRegister('sp', nextSpAddress);
    this.stackFrameSize -= INSTRUCTION_LENGTH_IN_BYTES;
    return this.memory.getUint32(nextSpAddress);
  }

  // TODO: extract the stack in it's own memory to avoid overlap
  pushState() {
    PUSHABLE_STATE.forEach((r)=>{
      this.push(this.getRegister(r))
    });

    this.push(this.stackFrameSize + INSTRUCTION_LENGTH_IN_BYTES);

    this.setRegister('fp', this.getRegister('sp'));
    this.stackFrameSize = 0;
  }

  popState() {
    const framePointerAddress = this.getRegister('fp');
    this.setRegister('sp', framePointerAddress);

    this.stackFrameSize = this.pop();
    const stackFrameSize = this.stackFrameSize;

    [...PUSHABLE_STATE].reverse().forEach((x)=>this.setRegister(x, this.pop()));

    const nArgs = this.pop();
    for (let i = 0; i < nArgs; i++) {
      this.pop();
    }

    this.setRegister('fp', framePointerAddress + stackFrameSize);
  }

  fetchRegisterIndex() {
    // clamped for bounds, *2 because we're pointing to a byte but each register takes up 2 bytes
    return (this.fetchCurrentInstruction32() % REGISTERS.length) * 4;
  }

  handleInterupt(value: number) {
    const interruptBit = value % 0xf;
    console.log(`CPU Interrupt :: ${interruptBit}`);

    // If the interrupt is masked by the interrupt mask register
    // then do not enter the interrupt handler
    const isUnmasked = Boolean((1 << interruptBit) & this.getRegister('im'));
    if (!isUnmasked) { // not enabled
      return;
    }

    // Calculate where in the interupt vector we'll look
    const addressPointer = this.interruptVectorAddress + (interruptBit * INSTRUCTION_LENGTH_IN_BYTES);
    // Get the address from the interupt vector at that address
    const address = this.memory.getUint32(addressPointer);

    // We only save state when not already in an interupt
    if (!this.isInInterruptHandler) {
      // 0 = 0 args. This is just to maintain our calling convention
      // If this were a software defined interrupt, the caller is expected
      // to supply any required data in registers
      this.push(0);
      // Save the state
      this.pushState();
    }

    this.isInInterruptHandler = true;

    // Jump to the interupt handler
    this.setRegister('ip', address);
  }

  getPixelColor(n: number){
    return this.image.imageData[n]
  }
  setPixelColor(n: number, value: number){
    if(n > 0 && n < this.imageCopy.length){
      this.imageCopy[n] = value;
    }
  }

  async execute(instruction: number) {
    // console.log(`$ Got instruction ${instruction}`)
    switch (instruction) {
      /**
       * Return from an interupt
       */
      case Instructions.RET_INT: { // TODO: 32 bit check
        console.log('Return from interupt');
        this.isInInterruptHandler = false;
        this.popState();
        return;
      }

      case Instructions.INT: { // TODO: 32 bit check
        // We're only looking at the least significant nibble
        const interuptValue = this.fetchCurrentInstruction32() & 0xf;
        this.handleInterupt(interuptValue);
        return;
      }

      // Move literal value into register
      case Instructions.MOV_LIT_REG: {
        const literal = this.fetchCurrentInstruction32();
        const register = this.fetchRegisterIndex();
        this.registers.setUint32(register, literal);
        return;
      }

      // Move a registers value to another registers value
      case Instructions.MOV_REG_REG: {
        const registerFrom = this.fetchRegisterIndex();
        const registerTo = this.fetchRegisterIndex();
        const value = this.registers.getUint32(registerFrom);
        this.registers.setUint32(registerTo, value);
        return;
      }

      // Move a registers value to a location in memory
      case Instructions.MOV_REG_MEM: {
        const registerFrom = this.fetchRegisterIndex();
        const address = this.fetchCurrentInstruction32();
        const value = this.registers.getUint32(registerFrom);
        this.memory.setUint32(address, value);
        return;
      }

      // Move the value of a memory location to a register
      case Instructions.MOV_MEM_REG: {
        const address = this.fetchCurrentInstruction32();
        const registerTo = this.fetchRegisterIndex();
        const value = this.memory.getUint32(address);
        this.registers.setUint32(registerTo, value);
        return;
      }

      // Move a literal value to a memory location
      case Instructions.MOV_LIT_MEM: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();
        this.memory.setUint32(address, value);
        return;
      }

      // Move register address to another register (is this even useful?)
      case Instructions.MOV_REG_PTR_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const ptr = this.registers.getUint32(r1);
        const value = this.memory.getUint32(ptr);
        this.registers.setUint32(r2, value);
        return;
      }

      /**
       * Move value at offset[literal + register] to register.
       * */ 
      case Instructions.MOV_LIT_OFF_REG: { // TODO: test this one.. did not
        const baseAddress = this.fetchCurrentInstruction32();
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const offset = this.registers.getUint32(r1);

        const value = this.memory.getUint32(baseAddress + offset);
        this.registers.setUint32(r2, value);
        return;
      }

      // Add a registers value to another registers value and puts the results in the accumulator
      case Instructions.ADD_REG_REG: {
        // (this.fetchCurrentInstruction32() % REGISTERS.length) * 4;
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint32(r1);
        const registerValue2 = this.registers.getUint32(r2);
        this.setRegister('acc', registerValue1 + registerValue2);
        return;
      }

      // Adds a literal value to registers value and puts the results in the accumulator
      case Instructions.ADD_LIT_REG: {
        const literal = this.fetchCurrentInstruction32();
        const register = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint32(register);
        this.setRegister('acc', literal + registerValue);
        return;
      }

      // Subtract a literal value from a registers value and puts the results in the accumulator
      case Instructions.SUB_LIT_REG: {
        const literal = this.fetchCurrentInstruction32();
        const register = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint32(register);
        this.setRegister('acc', registerValue - literal);
        return;
      }

      // Subtract a registers value from a literal value and puts the results in the accumulator
      case Instructions.SUB_REG_LIT: {
        const register = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction32();
        const registerValue = this.registers.getUint32(register);
        this.setRegister('acc', literal - registerValue);
        return;
      }

      // Subtract a registers value from another registers value and puts the results in the accumulator
      case Instructions.SUB_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const lhs = this.registers.getUint32(r1);
        const rhs = this.registers.getUint32(r2);
        this.setRegister('acc', lhs - rhs);
        return;
      }

      // Multiply a literal value by a registers value and puts the results in the accumulator
      case Instructions.MUL_LIT_REG: {
        const literal = this.fetchCurrentInstruction32();
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint32(r1);
        this.setRegister('acc', literal * registerValue);
        return;
      }

      // Multiply a registers value by another registers value and puts the results in the accumulator
      case Instructions.MUL_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const v1 = this.registers.getUint32(r1);
        const v2 = this.registers.getUint32(r2);
        this.setRegister('acc', v1 * v2);
        return;
      }

      // Increment value in register (puts result back in the same register)
      case Instructions.INC_REG: {
        const r1 = this.fetchRegisterIndex();
        const r1v = this.registers.getUint32(r1);
        this.registers.setUint32(r1, r1v + 1);
        return;
      }

      // Decrement value in register (puts result back in the same register)
      case Instructions.DEC_REG: {
        const r1 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint32(r1);
        this.registers.setUint32(r1, oldValue - 1);
        return;
      }

      /**
       * Left shift register by literal and puts the value back in the register
       * NOTE: Pay the literal value is 8 bits..
       */
      case Instructions.LSF_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction8();
        const oldValue = this.registers.getUint32(r1);
        const res = oldValue << literal; // do we need bigger shifting capabilities? (e.g. 16 bit lits)
        this.registers.setUint32(r1, res);
        return;
      }

      /**
       * Left shift first register provided by second register provided and puts the value back in the first provided register
       * NOTE: left shifting reg by reg allows you to shift by up to the max value of a 32-bit value.
       *        I.E: you're not constrained to the 8-bits from the literal to register shifts
       */
      case Instructions.LSF_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint32(r1);
        const shiftBy = this.registers.getUint32(r2);
        this.registers.setUint32(r1, oldValue << shiftBy);
        return;
      }

      /**
       * Right shift register by literal and puts the value back in the register
       * NOTE: again literals are 8-bit here. use reg>>reg for full 32-bit support
       */
      case Instructions.RSF_REG_LIT: {
        const register = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction8();
        const oldValue = this.registers.getUint32(register);
        this.registers.setUint32(register, oldValue >> literal);
        return;
      }

      /**
       * Right shift register by register without the 8-bit constraints.
       * Puts value back in the first provided register
       */
      case Instructions.RSF_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint32(r1);
        const shiftBy = this.registers.getUint32(r2);
        this.registers.setUint32(r1, oldValue >> shiftBy);
        return;
      }

      /**
       * And register with literal and puts it in the accumulator
       */
      case Instructions.AND_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction32();
        const registerValue = this.registers.getUint32(r1);
        this.setRegister('acc', registerValue & literal);
        return;
      }

      // And a registers value with another registers value and puts the results in the accumulator
      case Instructions.AND_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint32(r1);
        const registerValue2 = this.registers.getUint32(r2);
        this.setRegister('acc', registerValue1 & registerValue2);
        return;
      }

      // Or a registers value with a literal value and puts the results in the accumulator
      case Instructions.OR_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction32();
        const registerValue = this.registers.getUint32(r1);
        this.setRegister('acc', registerValue | literal);
        return;
      }

      // Or a registers value with another registers value and puts the results in the accumulator
      case Instructions.OR_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint32(r1);
        const registerValue2 = this.registers.getUint32(r2);
        this.setRegister('acc', registerValue1 | registerValue2);
        return;
      }

      // XOR a registers value with literal value and puts the results in the accumulator
      case Instructions.XOR_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetchCurrentInstruction32();
        const registerValue = this.registers.getUint32(r1);
        this.setRegister('acc', registerValue ^ literal);
        return;
      }

      // Xor a registers value with another registers value and puts the results in the accumulator
      case Instructions.XOR_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint32(r1);
        const registerValue2 = this.registers.getUint32(r2);
        this.setRegister('acc', registerValue1 ^ registerValue2);
        return;
      }

      // Bitwise-NOT a registers value and puts the result in the accumulator
      case Instructions.NOT: { // TODO: test this properly
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint32(r1);
        this.setRegister('acc', (~registerValue) & 0x7FFFFFFF);
        return;
      }

      // Jump to an address if literal value is not equal to the value in the accumulator
      case Instructions.JMP_NOT_EQ: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();
        if (value !== this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if supplied registers value is not equal to the accumulators value
      case Instructions.JNE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value !== this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal value is equal to the value in the accumulator
      case Instructions.JEQ_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value === this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if the supplied registers value is equal to the value in the accumulator.
      case Instructions.JEQ_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value === this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if supplied literal is less than the value in the accumulator
      case Instructions.JLT_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value < this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      //  Jump if supplied registers value is less than the value in the accumulator
      case Instructions.JLT_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value < this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than the val in accumulator
      case Instructions.JGT_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value > this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register greater than the value in accumulator
      case Instructions.JGT_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value > this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal less than or equal to accumulator
      case Instructions.JLE_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value <= this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register less than or equal to accumulator
      case Instructions.JLE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value <= this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than or equal to the accumulator
      case Instructions.JGE_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value >= this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register greater than or equal to the accumulator
      case Instructions.JGE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value >= this.getRegister('acc')) {
          this.IPStack.push(this.getRegister("ip"));
          this.setRegister('ip', address);
        }

        return;
      }

      case Instructions.GOTO: {
        const address = this.fetchCurrentInstruction32();
        this.setRegister('ip', address);
        return;
      }

      // Push Literal to the stack
      case Instructions.PSH_LIT: {
        const value = this.fetchCurrentInstruction32();
        this.push(value);
        return;
      }

      // Push Register
      case Instructions.PSH_REG: {
        const registerIndex = this.fetchRegisterIndex();
        this.push(this.registers.getUint32(registerIndex));
        return;
      }

      /**
       * @deprecated
       */
      case Instructions.PSH_STATE: {
        this.pushState()
        return;
      }

      case Instructions.PSH_IP: {
        this.IPStack.push(this.getRegister("ip"));
        return;
      }
      case Instructions.PSH_IP_OFFSETTED: {
        this.IPStack.push(this.getRegister("ip") + this.fetchCurrentInstruction32());
        return;
      }

      // Pop
      case Instructions.POP: {
        const registerIndex = this.fetchRegisterIndex();
        const value = this.IPStack.pop();
        if(!value) throw new Error("Pop called on an empty stack");
        this.registers.setUint32(registerIndex, value);
        return;
      }

      /**
       * Pushes the registry state to the stack and then calls the literal provided.
       * Using the return instruction you can return to the initial state
       * @see Instructions.RET for returning from this so-called sub-routine
       *  */ 
      case Instructions.CAL_LIT: {
        const address = this.fetchCurrentInstruction32();
        this.IPStack.push(this.getRegister("ip"));
        this.setRegister('ip', address);

        return;
      }

      // Call register
      case Instructions.CAL_REG: {
        const registerIndex = this.fetchRegisterIndex();
        const address = this.registers.getUint32(registerIndex);
        this.IPStack.push(this.getRegister("ip"));
        this.setRegister('ip', address);
        return;
      }

      /**
       * Gets a random value based on a start and end value (inclusive) and stores this in the accumulator
       */
      case Instructions.RAND: {
        const min = Math.ceil(this.fetchCurrentInstruction32());
        const max = Math.floor(this.fetchCurrentInstruction32());
        this.setRegister("acc", Math.floor(Math.random() * (max - min + 1) + min));
        return;
      }

      /**
       * Tells the VM not to execute a set of instructions. similar to jumping but here you can pass how
       * much to increment the Instruction Pointer by instead of having to provide a location on memory
       */
      case Instructions.SKIP: {
        const size = this.fetchCurrentInstruction32();
        this.setRegister("ip", this.getRegister("ip") + size);
        return;
      }

      case Instructions.MODIFY_PIXEL: {
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const color = this.getRegister("COL");
        const index = indexByCoordinates(x,y, this.image.width);
        this.imageCopy[index] = color;
        return;
      }
      case Instructions.NEIGHBORING_PIXEL_INDEX_TO_REG: {
        const direction = this.fetchCurrentInstruction8();
        const currentPixel = this.fetchCurrentInstruction32(); // where to check from
        const reg = this.fetchRegisterIndex(); // where to put it
        const idx = getNeighboringPixelIndex(direction, currentPixel, this.image.width);
        this.registers.setUint32(reg, idx);
        return;
      }
      case Instructions.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG: {
        const direction = this.fetchCurrentInstruction8();
        const currentPixel = this.registers.getUint32(this.fetchRegisterIndex()); // which register holds the current pixel
        const reg = this.fetchRegisterIndex(); // where to put it
        const idx = getNeighboringPixelIndex(direction, currentPixel, this.image.width);
        this.registers.setUint32(reg, idx);
        return;
      }

      case Instructions.FETCH_PIXEL_COLOR_BY_INDEX: {
        const pixelIndex = this.fetchCurrentInstruction32(); // where to check from
        this.setRegister("COL", this.image.imageData[pixelIndex])
        return;
      }
      case Instructions.FETCH_PIXEL_COLOR_BY_REGISTER_INDEX: {
        const pixelIndex = this.registers.getUint32(this.fetchRegisterIndex());
        this.setRegister("COL", this.image.imageData[pixelIndex])
        return;
      }
      case Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES: {
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const reg = this.fetchRegisterIndex(); // where to store
        this.registers.setUint32(reg, indexByCoordinates(x,y,this.image.width));
        return;
      }

      case Instructions.RGB_FROMREG_TO_COLOR: {
        const r = this.getRegister("R") as U255;
        const g = this.getRegister("G") as U255;
        const b = this.getRegister("B") as U255;
        this.setRegister("COL", combineRGB([r,g,b]));
        return;
      }

      case Instructions.RGB_LIT_TO_COLOR: {
        const r = this.fetchCurrentInstruction8() as U255;
        const g = this.fetchCurrentInstruction8() as U255;
        const b = this.fetchCurrentInstruction8() as U255;
        this.setRegister("COL", combineRGB([r,g,b]));
        return;
      }

      case Instructions.COLOR_FROMREG_TO_RGB: {
        const color = this.getRegister("COL");
        const [r,g,b] = spreadRGB(color)
        this.setRegister("R", r);
        this.setRegister("G", g);
        this.setRegister("B", b);
        return;
      }

      case Instructions.LANGTONS_ANT: {
        let currentX = this.getRegister("x");
        let currentY = this.getRegister("y");
        let direction = this.getRegister("r9"); // TODO: dedicated or something else
        const color1 = this.fetchCurrentInstruction32(); // clock
        const color2 = this.fetchCurrentInstruction32(); // anti-clock

        const thisIndex = indexByCoordinates(currentX, currentY, this.image.width);
        
        const moveForward = (d: number)=>{
          switch(d){
            case 1: currentX++; break; // 1 -> right
            case 2: currentY++; break; // 2 -> bottom
            case 3: currentX--; break; // 3  -> left
            case 4: currentY--; break; // 4 -> top
          }
        }

        const saveBack = (dir: number, x: number, y: number) => {
          this.setRegister("r9", dir);
          this.setRegister("x", x);
          this.setRegister("y", y);
        }

        if(color1 === this.image.imageData[thisIndex]){
          // turn 90° clockwise, 
          direction++;
          if(direction > 4) direction = 1;
          // flip the color of the square,
          this.imageCopy[thisIndex] = color2;
          // move forward one unit
          moveForward(direction);
          saveBack(direction, currentX, currentY);
        }else if(color2 === this.image.imageData[indexByCoordinates(currentX, currentY, this.image.width)]){
          // turn 90° counter-clockwise
          direction--;
          if(direction < 1) direction = 4;
          // flip the color of the square
          this.imageCopy[thisIndex] = color1;
          // move forward one unit
          moveForward(direction);
          saveBack(direction, currentX, currentY);
        }
        return;
      }

      case Instructions.SEEDS: {
        const onColor = this.fetchCurrentInstruction32();
        const offColor = this.fetchCurrentInstruction32();
        for(let i = 0; i < this.image.imageData.length;i++) seeds(this, i ,onColor, offColor);
        return;
      }


      case Instructions.DRAW_BOX: {
        const color = this.getRegister("COL");

        const x = this.getRegister("x");
        const y = this.getRegister("y");

        const width = this.fetchCurrentInstruction32(); // supplied
        const height = this.fetchCurrentInstruction32(); // supplied


          for (let tY = 0; tY <= height; tY++) {
            for (let tX = 0; tX <= width; tX++) {
              const nX = tX + x; const nY = tY + y;
              if (Math.min(nX, nY) < 1 || nX > this.image.width || nY > this.image.height) continue;
              this.imageCopy[indexByCoordinates(nX, nY, this.image.width)] = color;
            }
        }
        return;
      }

      case Instructions.DRAW_CIRCLE: {
        const color = this.getRegister("COL");

        const x = this.getRegister("x");
        const y = this.getRegister("y");

        const radius = this.fetchCurrentInstruction32(); // supplied

        const radSquared = radius ** 2;
        for (let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, this.image.height); currentY++) {
            for (let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, this.image.width); currentX++) {
                if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) this.imageCopy[indexByCoordinates(currentX, currentY, this.image.width)] = color;
            }
        }
        return;
      }
      case Instructions.DRAW_LINE_P1REG_P2REG: {
        const point1_x = this.registers.getUint32(this.fetchRegisterIndex());
        const point1_y = this.registers.getUint32(this.fetchRegisterIndex());

        const point2_x = this.registers.getUint32(this.fetchRegisterIndex());
        const point2_y = this.registers.getUint32(this.fetchRegisterIndex());
        drawLine(this,point1_x, point1_y,  point2_x, point2_y);
        return;
      }
      case Instructions.DRAW_LINE_P1LIT_P2LIT: {
        const point1_x = this.fetchCurrentInstruction32();
        const point1_y = this.fetchCurrentInstruction32();

        const point2_x = this.fetchCurrentInstruction32();
        const point2_y = this.fetchCurrentInstruction32();
        drawLine(this,point1_x, point1_y,  point2_x, point2_y);
        return;
      }


      case Instructions.IMAGE_WIDTH_REG: {
        const regToStoreIn = this.fetchRegisterIndex();
        this.registers.setUint32(regToStoreIn, this.image.width);
        return;
      }
      case Instructions.IMAGE_HEIGHT_REG: {
        const regToStoreIn = this.fetchRegisterIndex();
        this.registers.setUint32(regToStoreIn, this.image.height);
        return;
      }
      case Instructions.IMAGE_TOTAL_PIXELS_REG: {
        const regToStoreIn = this.fetchRegisterIndex();
        this.registers.setUint32(regToStoreIn, this.image.width * this.image.height);
        return;
      }
      case Instructions.INCREASE_PIXEL_LUMINOSITY_REG: {
        const luminosity = this.registers.getUint32(this.fetchRegisterIndex());
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const index = indexByCoordinates(x,y,this.image.width);
        this.imageCopy[index] = modifyLuminosity(luminosity, this.imageCopy[index]);
        return;
      }
      case Instructions.DECREASE_PIXEL_LUMINOSITY_REG: {
        const luminosity = -this.registers.getUint32(this.fetchRegisterIndex());
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const index = indexByCoordinates(x,y,this.image.width);
        this.imageCopy[index] = modifyLuminosity(luminosity, this.imageCopy[index]);
        return;
      }
      case Instructions.INCREASE_IMAGE_LUMINOSITY_REG: {
        const luminosity = this.registers.getUint32(this.fetchRegisterIndex());
        for(let i = 0; i < this.imageCopy.length; i++) this.imageCopy[i] = modifyLuminosity(luminosity, this.imageCopy[i]);
        return;
      }
      case Instructions.DECREASE_IMAGE_LUMINOSITY_REG: {
        const luminosity = -this.registers.getUint32(this.fetchRegisterIndex());
        for(let i = 0; i < this.imageCopy.length; i++) this.imageCopy[i] = modifyLuminosity(luminosity, this.imageCopy[i]);
        return;
      }

      case Instructions.INTERVAL: {
        const time = this.fetchCurrentInstruction32();
        const addressToCall = this.fetchCurrentInstruction32();
        const intervalHandler = setInterval(()=>{
          if(!this.halt){
            this.pushState();
            this.setRegister('ip', addressToCall);
          }
        }, time);
        this.setRegister("r9", intervalHandler); // TODO: make a dedicated place for this

        return;
      }


      case Instructions.RENDER: {
        this.render();
        return;
      }


      // Return from subroutine
      case Instructions.RET: {
        let lastIP = this.IPStack.pop();
        if(!lastIP) throw new Error("Nowhere to return to");
        this.setRegister("ip", lastIP);
        return;
      }

      case Instructions.RET_TO_NEXT: {
        let lastIP = this.IPStack.pop();
        if(!lastIP) throw new Error("Nowhere to return to");
        this.setRegister("ip", lastIP + 1);
        return;
      }

      case Instructions.SLEEP: {
        const time = this.fetchCurrentInstruction32();
        await sleep(time);
        return;
      }

      // Halt all computation
      case Instructions.HLT: {
        return true;
      }
      case Instructions.DEBUG: {
        const id = this.fetchCurrentInstruction8();
        console.log(`####### DEBUG ${id} ##################`)
        this.debug();
        console.log(`####### END DEBUG ${id} ##############`)
        return;
      }
      case 0: {return;}
      default: console.error(`instruction ${0} is not an executable instruction, make sure your instructions are aligned properly by padding the values that are too small for a complete instruction.`)
    }
  }

  async step() {
    const instruction = this.fetchCurrentInstruction8();
    // console.log(`IP[${this.getRegister("ip")}] -> instr: ${instruction} $$ ${InstructionInformation[instruction as Instructions]?.desc || "EMPTY SLOT"}`)
    if(instruction === 0) this.emptyInstructionAtStep++;
    if(instruction === -1 || this.emptyInstructionAtStep > 50) return true;
    return await this.execute(instruction);
  }

  async run() {
    this.halt = await this.step() || false;
    if (!this.halt) {
      setTimeout(() => this.run());
    }
  }
}