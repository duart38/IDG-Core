import {Instructions, RegisterKey, REGISTERS} from "./Registers.ts"
import {createMemory, MemoryMapper} from "./Memory.ts"
import { getNeighboringPixelIndex, indexByCoordinates } from "../utils/coordinates.ts";
import { ImageData } from "../interfaces/Image.ts";
import { combineRGB, spreadRGB } from "../utils/color.ts";
import { U255 } from "../interfaces/RGBA.ts";

const INSTRUCTION_LENGTH_IN_BYTES = 4;
const PLANK = INSTRUCTION_LENGTH_IN_BYTES == 4 ? 0x7FFFFFFF : 0xffff;

export default class IDGVM {


  // TODO: flushState(); -> flushes memory and other info to the idg file for hard storage. (probably should be a module)
  // TODO: image specific instructions like drawing lines and filling a sections.
  // TODO: pixel specific instructions.
  // TODO: choose where to storage image in memory and standardize it (could also be done outside of the Machine)
  // TODO: any method that requires combining more instructions should be done in a higher level language
  // TODO: MAYBE even define a separate memory for the Image, 
  // TODO: LOOP instruction..

  // TODO: i want clock based events built in here... this saves me time when i potentially need to interrupt to check clock time..
  //        also what if a different VM does not implement clock? this could be problematic..
  //        also part 2.. all systems have a clock... and if they don't we emulate it..
  //        the clock does not REALLY have to be here we could also define a volatile memory location for it and let some thread or something update it as it sees fit..
  //        this reduces the internal instructions required here and forces a modularity approach which could be used depending on the system.

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
  private imageCopy: number[];
  /** The image itself */
  private image: ImageData;
  /**
   * Callback that is executed when a render request has been made
   */
  private imageRenderCB: (newImage: number[])=>void;
  
  /**
   * 
   * @param memory Refers to the allocated memory available to our system
   * @param interruptVectorAddress 
   */
  constructor(memory: MemoryMapper, image: ImageData, interruptVectorAddress = 0x249F0) {
    this.memory = memory;
    this.image = image;
    this.imageCopy = [...image.imageData];
    this.imageRenderCB = ()=>{};

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
    this.setRegister('im', PLANK);

    this.setRegister('sp', PLANK - 1);
    this.setRegister('fp', PLANK - 1);

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
    const instruction = this.memory.getUint8(nextInstructionAddress);
    // increment the program counter (instruction pointer) to the next instruction.
    this.setRegister('ip', nextInstructionAddress + 1);
    return instruction;
  }

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
    const spAddress = this.getRegister('sp');
    this.memory.setUint32(spAddress, value);
    this.setRegister('sp', spAddress - INSTRUCTION_LENGTH_IN_BYTES); // moving stack pointer down
    this.stackFrameSize += INSTRUCTION_LENGTH_IN_BYTES;
  }

  pop() {
    const nextSpAddress = this.getRegister('sp') + INSTRUCTION_LENGTH_IN_BYTES;
    this.setRegister('sp', nextSpAddress);
    this.stackFrameSize -= INSTRUCTION_LENGTH_IN_BYTES;
    return this.memory.getUint32(nextSpAddress);
  }

  pushState() {
    this.push(this.getRegister('r1'));
    this.push(this.getRegister('r2'));
    this.push(this.getRegister('r3'));
    this.push(this.getRegister('r4'));
    this.push(this.getRegister('r5'));
    this.push(this.getRegister('r6'));
    this.push(this.getRegister('r7'));
    this.push(this.getRegister('r8'));
    this.push(this.getRegister('ip'));
    this.push(this.stackFrameSize + INSTRUCTION_LENGTH_IN_BYTES);

    this.setRegister('fp', this.getRegister('sp'));
    this.stackFrameSize = 0;
  }

  popState() {
    const framePointerAddress = this.getRegister('fp');
    this.setRegister('sp', framePointerAddress);

    this.stackFrameSize = this.pop();
    const stackFrameSize = this.stackFrameSize;

    this.setRegister('ip', this.pop());
    this.setRegister('r8', this.pop());
    this.setRegister('r7', this.pop());
    this.setRegister('r6', this.pop());
    this.setRegister('r5', this.pop());
    this.setRegister('r4', this.pop());
    this.setRegister('r3', this.pop());
    this.setRegister('r2', this.pop());
    this.setRegister('r1', this.pop());

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

  execute(instruction: number) {
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
        const addressToJumpTo = this.fetchCurrentInstruction32();
        if (value !== this.getRegister('acc')) {
          this.setRegister('ip', addressToJumpTo);
        }

        return;
      }

      // Jump if supplied registers value is not equal to the accumulators value
      case Instructions.JNE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint32(r1);
        const address = this.fetchCurrentInstruction32();

        if (value !== this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal value is equal to the value in the accumulator
      case Instructions.JEQ_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value === this.getRegister('acc')) {
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
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if supplied literal is less than the value in the accumulator
      case Instructions.JLT_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value < this.getRegister('acc')) {
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
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than the val in accumulator
      case Instructions.JGT_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value > this.getRegister('acc')) {
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
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal less than or equal to accumulator
      case Instructions.JLE_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value <= this.getRegister('acc')) {
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
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than or equal to the accumulator
      case Instructions.JGE_LIT: {
        const value = this.fetchCurrentInstruction32();
        const address = this.fetchCurrentInstruction32();

        if (value >= this.getRegister('acc')) {
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
          this.setRegister('ip', address);
        }

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

      // Pop
      case Instructions.POP: {
        const registerIndex = this.fetchRegisterIndex();
        const value = this.pop();
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
        this.pushState();
        this.setRegister('ip', address);
        return;
      }

      // Call register
      case Instructions.CAL_REG: {
        const registerIndex = this.fetchRegisterIndex();
        const address = this.registers.getUint32(registerIndex);
        this.pushState();
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
        // const x = this.fetchCurrentInstruction32();
        // const y = this.fetchCurrentInstruction32();
        // const color = this.fetchCurrentInstruction32();
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

      case Instructions.FETCH_PIXEL_COLOR_BY_INDEX: {
        const pixelIndex = this.fetchCurrentInstruction32(); // where to check from
        this.setRegister("COL", this.image.imageData[pixelIndex])
        return;
      }
      case Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES: {
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const reg = this.fetchCurrentInstruction32(); // where to store
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


      case Instructions.DRAW_BOX: {
        const color = this.getRegister("COL");

        let x = this.getRegister("x");
        let y = this.getRegister("y");

        let width = this.fetchCurrentInstruction32(); // supplied
        let height = this.fetchCurrentInstruction32(); // supplied


          for (let tY = 0; tY <= height; tY++) {
            for (let tX = 0; tX <= width; tX++) {
              const nX = tX + x;
              const nY = tY + y;
              if (Math.min(nX, nY) < 1 || nX > this.image.width || nY > this.image.height) continue;
              this.imageCopy[indexByCoordinates(nX, nY, this.image.width)] = color;
            }
        }
        return;
      }
      case Instructions.INTERVAL: {
        let time = this.fetchCurrentInstruction32();
        let addressToCall = this.fetchCurrentInstruction32();
        console.log("Interval created");
        let intervalHandler = setInterval(()=>{
          console.log("Interval called");
          this.pushState();
          this.setRegister('ip', addressToCall);
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
        this.popState();
        return;
      }

      case Instructions.RET_TO_NEXT: {
        this.popState();
        this.setRegister("ip", this.getRegister("ip") + 1);
        return;
      }

      // Halt all computation
      case Instructions.HLT: {
        return true;
      }
      case 0: {return;}
      default: console.error(`instruction ${0} is not an executable instruction, make sure your instructions are aligned properly by padding the values that are too small for a complete instruction.`)
    }
  }

  step() {
    const instruction = this.fetchCurrentInstruction8();
    if(instruction === 0) this.emptyInstructionAtStep++;
    if(this.emptyInstructionAtStep > 50) return true;
    return this.execute(instruction);
  }

  run() {
    const halt = this.step();
    if (!halt) {
      setInterval(() => this.run());
    }
  }
}