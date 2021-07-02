import {Instructions, REGISTERS} from "./Registers.ts"
import {createMemory, MemoryMapper} from "./Memory.ts"

export default class CPU {


  // TODO: flushState(); -> flushes memory and other info to the idg file for hard storage.
  // TODO: image specific instructions like drawing lines and filling a sections.
  // TODO: pixel specific instructions.
  // TODO: choose where to storage image in memory and standardize it (could also be done outside of the Machine)
  // TODO: any method that requires combining more instructions should be done in a higher level language

  private registers: DataView;
  private memory: MemoryMapper;
  private registerMap: Record<string, number>;
  private interuptVectorAddress: number;
  private isInInteruptHandler: boolean;
  private stackFrameSize: number;
  
  /**
   * 
   * @param memory Refers to the allocated memory available to our system
   * @param interuptVectorAddress 
   */
  constructor(memory: MemoryMapper, interuptVectorAddress = 0x1000) {
    this.memory = memory;

    this.registers = createMemory(REGISTERS.length * 2);
    this.registerMap = REGISTERS.reduce((map, name, i) => {
      map[name] = i * 2;
      return map;
    }, {} as Record<string, number>);

    this.interuptVectorAddress = interuptVectorAddress;
    this.isInInteruptHandler = false;
    this.setRegister('im', 0xffff);

    this.setRegister('sp', 0xffff - 1);
    this.setRegister('fp', 0xffff - 1);

    this.stackFrameSize = 0;
  }

  debug() {
    for(let name in this.registerMap){
      try{
        console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
      }catch(e){
        console.error("Potential empty stack (did you forget to add instructions?)", e);
      }
    }
    console.log();
  }

  viewMemoryAt(address: number, n = 8) {
    // 0x0f01: 0x04 0x05 0xA3 0xFE 0x13 0x0D 0x44 0x0F ...
    const nextNBytes = Array.from({length: n}, (_, i) =>
      this.memory.getUint8(address + i)
    ).map(v => `0x${v.toString(16).padStart(2, '0')}`);

    console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextNBytes.join(' ')}`);
  }

  getRegister(name: string) {
    if (!(name in this.registerMap)) {
      throw new Error(`getRegister: No such register '${name}'`);
    }
    return this.registers.getUint16(this.registerMap[name]);
  }

  setRegister(name: string, value: number) {
    if (!(name in this.registerMap)) {
      throw new Error(`setRegister: No such register '${name}'`);
    }
    return this.registers.setUint16(this.registerMap[name], value);
  }

  fetch() {
    const nextInstructionAddress = this.getRegister('ip');
    const instruction = this.memory.getUint8(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 1);
    return instruction;
  }

  fetch16() {
    const nextInstructionAddress = this.getRegister('ip');
    const instruction = this.memory.getUint16(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 2);
    return instruction;
  }

  push(value: number) {
    const spAddress = this.getRegister('sp');
    this.memory.setUint16(spAddress, value);
    this.setRegister('sp', spAddress - 2);
    this.stackFrameSize += 2;
  }

  pop() {
    const nextSpAddress = this.getRegister('sp') + 2;
    this.setRegister('sp', nextSpAddress);
    this.stackFrameSize -= 2;
    return this.memory.getUint16(nextSpAddress);
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
    this.push(this.stackFrameSize + 2);

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
    return (this.fetch() % REGISTERS.length) * 2;
  }

  handleInterupt(value: number) {
    const interruptBit = value % 0xf;
    console.log(`CPU Interrupt :: ${interruptBit}`);

    // If the interrupt is masked by the interrupt mask register
    // then do not enter the interrupt handler
    const isUnmasked = Boolean((1 << interruptBit) & this.getRegister('im'));
    if (!isUnmasked) {
      return;
    }

    // Calculate where in the interupt vector we'll look
    const addressPointer = this.interuptVectorAddress + (interruptBit * 2);
    // Get the address from the interupt vector at that address
    const address = this.memory.getUint16(addressPointer);

    // We only save state when not already in an interupt
    if (!this.isInInteruptHandler) {
      // 0 = 0 args. This is just to maintain our calling convention
      // If this were a software defined interrupt, the caller is expected
      // to supply any required data in registers
      this.push(0);
      // Save the state
      this.pushState();
    }

    this.isInInteruptHandler = true;

    // Jump to the interupt handler
    this.setRegister('ip', address);
  }

  execute(instruction: number) {
    switch (instruction) {
      case Instructions.RET_INT: {
        console.log('Return from interupt');
        this.isInInteruptHandler = false;
        this.popState();
        return;
      }

      case Instructions.INT: {
        // We're only looking at the least significant nibble
        const interuptValue = this.fetch16() & 0xf;
        this.handleInterupt(interuptValue);
        return;
      }

      // Move literal into register
      case Instructions.MOV_LIT_REG: {
        const literal = this.fetch16();
        const register = this.fetchRegisterIndex();
        this.registers.setUint16(register, literal);
        return;
      }

      // Move register to register
      case Instructions.MOV_REG_REG: {
        const registerFrom = this.fetchRegisterIndex();
        const registerTo = this.fetchRegisterIndex();
        const value = this.registers.getUint16(registerFrom);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Move register to memory
      case Instructions.MOV_REG_MEM: {
        const registerFrom = this.fetchRegisterIndex();
        const address = this.fetch16();
        const value = this.registers.getUint16(registerFrom);
        this.memory.setUint16(address, value);
        return;
      }

      // Move memory to register
      case Instructions.MOV_MEM_REG: {
        const address = this.fetch16();
        const registerTo = this.fetchRegisterIndex();
        const value = this.memory.getUint16(address);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Move literal to memory
      case Instructions.MOV_LIT_MEM: {
        const value = this.fetch16();
        const address = this.fetch16();
        this.memory.setUint16(address, value);
        return;
      }

      // Move register* to register
      case Instructions.MOV_REG_PTR_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const ptr = this.registers.getUint16(r1);
        const value = this.memory.getUint16(ptr);
        this.registers.setUint16(r2, value);
        return;
      }

      // Move value at [literal + register] to register
      case Instructions.MOV_LIT_OFF_REG: {
        const baseAddress = this.fetch16();
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const offset = this.registers.getUint16(r1);

        const value = this.memory.getUint16(baseAddress + offset);
        this.registers.setUint16(r2, value);
        return;
      }

      // Add register to register
      case Instructions.ADD_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);
        this.setRegister('acc', registerValue1 + registerValue2);
        return;
      }

      // Add literal to register
      case Instructions.ADD_LIT_REG: {
        const literal = this.fetch16();
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint16(r1);
        this.setRegister('acc', literal + registerValue);
        return;
      }

      // Subtract literal from register value
      case Instructions.SUB_LIT_REG: {
        const literal = this.fetch16();
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint16(r1);
        const res = registerValue - literal;
        this.setRegister('acc', res);
        return;
      }

      // Subtract register value from literal
      case Instructions.SUB_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch16();
        const registerValue = this.registers.getUint16(r1);
        const res = literal - registerValue;
        this.setRegister('acc', res);
        return;
      }

      // Subtract register value from register value
      case Instructions.SUB_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);
        const res = registerValue1 - registerValue2;
        this.setRegister('acc', res);
        return;
      }

      // Multiply literal by register value
      case Instructions.MUL_LIT_REG: {
        const literal = this.fetch16();
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint16(r1);
        const res = literal * registerValue;
        this.setRegister('acc', res);
        return;
      }

      // Multiply register value by register value
      case Instructions.MUL_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);
        const res = registerValue1 * registerValue2;
        this.setRegister('acc', res);
        return;
      }

      // Increment value in register (in place)
      case Instructions.INC_REG: {
        const r1 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint16(r1);
        const newValue = oldValue + 1;
        this.registers.setUint16(r1, newValue);
        return;
      }

      // Decrement value in register (in place)
      case Instructions.DEC_REG: {
        const r1 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint16(r1);
        const newValue = oldValue - 1;
        this.registers.setUint16(r1, newValue);
        return;
      }

      // Left shift register by literal (in place)
      case Instructions.LSF_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch();
        const oldValue = this.registers.getUint16(r1);
        const res = oldValue << literal;
        this.registers.setUint16(r1, res);
        return;
      }

      // Left shift register by register (in place)
      case Instructions.LSF_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint16(r1);
        const shiftBy = this.registers.getUint16(r2);
        const res = oldValue << shiftBy;
        this.registers.setUint16(r1, res);
        return;
      }

      // Right shift register by literal (in place)
      case Instructions.RSF_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch();
        const oldValue = this.registers.getUint16(r1);
        const res = oldValue >> literal;
        this.registers.setUint16(r1, res);
        return;
      }

      // Right shift register by register (in place)
      case Instructions.RSF_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const oldValue = this.registers.getUint16(r1);
        const shiftBy = this.registers.getUint16(r2);
        const res = oldValue >> shiftBy;
        this.registers.setUint16(r1, res);
        return;
      }

      // And register with literal
      case Instructions.AND_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch16();
        const registerValue = this.registers.getUint16(r1);

        const res = registerValue & literal;
        this.setRegister('acc', res);
        return;
      }

      // And register with register
      case Instructions.AND_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);

        const res = registerValue1 & registerValue2;
        this.setRegister('acc', res);
        return;
      }

      // Or register with literal
      case Instructions.OR_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch16();
        const registerValue = this.registers.getUint16(r1);

        const res = registerValue | literal;
        this.setRegister('acc', res);
        return;
      }

      // Or register with register
      case Instructions.OR_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);

        const res = registerValue1 | registerValue2;
        this.setRegister('acc', res);
        return;
      }

      // Xor register with literal
      case Instructions.XOR_REG_LIT: {
        const r1 = this.fetchRegisterIndex();
        const literal = this.fetch16();
        const registerValue = this.registers.getUint16(r1);

        const res = registerValue ^ literal;
        this.setRegister('acc', res);
        return;
      }

      // Xor register with register
      case Instructions.XOR_REG_REG: {
        const r1 = this.fetchRegisterIndex();
        const r2 = this.fetchRegisterIndex();
        const registerValue1 = this.registers.getUint16(r1);
        const registerValue2 = this.registers.getUint16(r2);

        const res = registerValue1 ^ registerValue2;
        this.setRegister('acc', res);
        return;
      }

      // Not (invert) register
      case Instructions.NOT: {
        const r1 = this.fetchRegisterIndex();
        const registerValue = this.registers.getUint16(r1);

        const res = (~registerValue) & 0xffff;
        this.setRegister('acc', res);
        return;
      }

      // Jump if literal not equal
      case Instructions.JMP_NOT_EQ: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value !== this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register not equal
      case Instructions.JNE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value !== this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal equal
      case Instructions.JEQ_LIT: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value === this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register equal
      case Instructions.JEQ_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value === this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal less than
      case Instructions.JLT_LIT: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value < this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register less than
      case Instructions.JLT_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value < this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than
      case Instructions.JGT_LIT: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value > this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register greater than
      case Instructions.JGT_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value > this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal less than or equal to
      case Instructions.JLE_LIT: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value <= this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register less than or equal to
      case Instructions.JLE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value <= this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if literal greater than or equal to
      case Instructions.JGE_LIT: {
        const value = this.fetch16();
        const address = this.fetch16();

        if (value >= this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Jump if register greater than or equal to
      case Instructions.JGE_REG: {
        const r1 = this.fetchRegisterIndex();
        const value = this.registers.getUint16(r1);
        const address = this.fetch16();

        if (value >= this.getRegister('acc')) {
          this.setRegister('ip', address);
        }

        return;
      }

      // Push Literal
      case Instructions.PSH_LIT: {
        const value = this.fetch16();
        this.push(value);
        return;
      }

      // Push Register
      case Instructions.PSH_REG: {
        const registerIndex = this.fetchRegisterIndex();
        this.push(this.registers.getUint16(registerIndex));
        return;
      }

      // Pop
      case Instructions.POP: {
        const registerIndex = this.fetchRegisterIndex();
        const value = this.pop();
        this.registers.setUint16(registerIndex, value);
        return;
      }

      // Call literal
      case Instructions.CAL_LIT: {
        const address = this.fetch16();
        this.pushState();
        this.setRegister('ip', address);
        return;
      }

      // Call register
      case Instructions.CAL_REG: {
        const registerIndex = this.fetchRegisterIndex();
        const address = this.registers.getUint16(registerIndex);
        this.pushState();
        this.setRegister('ip', address);
        return;
      }

      // Return from subroutine
      case Instructions.RET: {
        this.popState();
        return;
      }

      // Halt all computation
      case Instructions.HLT: {
        return true;
      }
    }
  }

  step() {
    const instruction = this.fetch();
    return this.execute(instruction);
  }

  run() {
    const halt = this.step();
    if (!halt) {
      setInterval(() => this.run());
    }
  }
}