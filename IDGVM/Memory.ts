import { DecodedFile } from "../interfaces/FileShape.ts";
import { InstructionParams, Instructions, ParameterFetchType, PUSHABLE_STATE, RegisterKey, REGISTERS } from "./Registers.ts";

export const createMemory = (sizeInBytes: number) => {
  const ab = new ArrayBuffer(sizeInBytes);
  const dv = new DataView(ab);
  return dv;
};

interface Region {
  device: DataView;
  start: number;
  end: number;
  remap: boolean;
}
const INSTRUCTION_LENGTH_IN_BYTES = 4;
const PLANK = INSTRUCTION_LENGTH_IN_BYTES == 4 ? 0x7FFFFFFF : 0xffff;
export class MemoryMapper {
  private regions: Region[]; // TODO: change me
  constructor() {
    this.regions = [];
  }

  /**
   * Maps an address space for something like I/O. this method returns a method that can be used for unmapping the region.
   * @param device
   * @param start
   * @param end
   * @param remap
   * @returns a method to un-map the mapped
   */
  map(device: DataView, start: number, end: number, remap = true) {
    const region = {
      device,
      start,
      end,
      remap,
    };
    this.regions.unshift(region);

    return () => {
      this.regions = this.regions.filter((x) => x !== region);
    };
  }

  findRegion(address: number) {
    let region = this.regions.find(
      (r: { start: number; end: number }) =>
        address >= r.start && address <= r.end
    );
    if (!region) {
      throw new Error(`No memory region found for address ${address}`);
    }
    return region;
  }

  getUint16(address: number): number {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.getUint16(finalAddress);
  }

  getUint8(address: number): number {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.getUint8(finalAddress);
  }

  getInt8(address: number): number {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.getInt8(finalAddress);
  }


  getUint32(address: number): number {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.getUint32(finalAddress);
  }
  getInt32(address: number): number {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.getInt32(finalAddress);
  }

  setUint32(address: number, value: number): void {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.setUint32(finalAddress, value);
  }
  setInt32(address: number, value: number): void {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.setInt32(finalAddress, value);
  }

  setUint16(address: number, value: number): void {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.setUint16(finalAddress, value);
  }

  setUint8(address: number, value: number): void {
    const region = this.findRegion(address);
    const finalAddress = region.remap ? address - region.start : address;
    return region.device.setUint8(finalAddress, value);
  }

  load(startAddress: number, data: number[]) {
    data.forEach((byte, offset) => this.setUint8(startAddress + offset, byte));
  }
}
export class InstructionParser {
  protected registers: DataView;
  protected memory: MemoryMapper;
  protected registerMap: Record<RegisterKey, number>;
  protected interruptVectorAddress: number;
  protected isInInterruptHandler: boolean;
  protected stackFrameSize: number;

  protected allocatedAmount: number;
  protected halt = false;

    /**
   * Indicates how many empty instructions we saw after each other..
   */
     protected emptyInstructionAtStep = 0;
  constructor(memory: MemoryMapper, loadedFile: DecodedFile, interruptVectorAddress = 0x249F0) {
    this.memory = memory;
    this.allocatedAmount = loadedFile.memoryRequest;
     /**
     * Creating memory for actual values of register
     * System is currently 32-bits so that's 24bytes for each register
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

  /**
   * Fetches a register from the instruction.
   * Currently the fetched is a 32-bit instruction
   *
   * */
  fetchRegisterIndex() {
    // clamped for bounds, *2 because we're pointing to a byte but each register takes up 2 bytes
    //return (this.fetchCurrentInstruction32() % REGISTERS.length) * 4;
    return this.fetchCurrentInstruction32();
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
  getSignedRegister(name: RegisterKey) {
    if (!(name in this.registerMap)) {
      throw new Error(`getRegister: No such register '${name}'`);
    }
    return this.registers.getInt32(this.registerMap[name]);
  }
  getRegisterAt(offset: number){
    return this.registers.getUint32(offset);
  }
  getSignedRegisterAt(offset: number){
    return this.registers.getInt32(offset);
  }

  setRegister(name: RegisterKey, value: number) {
    if (!(name in this.registerMap)) {
      throw new Error(`setRegister: No such register '${name}'`);
    }
    return this.registers.setUint32(this.registerMap[name], value);
  }
  setSignedRegister(name: RegisterKey, value: number) {
    if (!(name in this.registerMap)) {
      throw new Error(`setRegister: No such register '${name}'`);
    }
    return this.registers.setInt32(this.registerMap[name], value);
  }
  setRegisterAt(offset: number, value: number){
    this.registers.setUint32(offset, value);
  }
  setSignedRegisterAt(offset: number, value: number){
    this.registers.setInt32(offset, value);
  }
  setMemoryAt(offset: number, value: number){
    this.memory.setUint32(offset, value);
  }
  setSignedMemoryAt(offset: number, value: number){
    this.memory.setInt32(offset, value);
  }

  getMemoryAt(offset: number){
    return this.memory.getUint32(offset);
  }
  getSignedMemoryAt(offset: number){
    return this.memory.getInt32(offset);
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

  /**
   * Fetches the current instruction to be returned and increments the instruction pointer
   * to the next address to be executed next
   * @returns an executable instruction
   */
  public fetchCurrentInstruction8() {
    // get the instruction pointer address that houses the next instruction
    const nextInstructionAddress = this.getRegister("ip");
    // gets the actual instruction value from that location in memory
    if (nextInstructionAddress + 1 > this.allocatedAmount) {
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getUint8(nextInstructionAddress);
    // increment the program counter (instruction pointer) to the next instruction.
    this.setRegister("ip", nextInstructionAddress + 1);
    return instruction;
  }

  public fetchCurrentSignedInstruction8() {
    // get the instruction pointer address that houses the next instruction
    const nextInstructionAddress = this.getRegister("ip");
    // gets the actual instruction value from that location in memory
    if (nextInstructionAddress + 1 > this.allocatedAmount) {
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getInt8(nextInstructionAddress);
    // increment the program counter (instruction pointer) to the next instruction.
    this.setRegister("ip", nextInstructionAddress + 1);
    return instruction;
  }
  //TODO: fetch instruction methods for signed integers

  public fetchCurrentInstruction16() {
    const nextInstructionAddress = this.getRegister("ip");
    if (nextInstructionAddress + 2 > this.allocatedAmount) {
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getUint16(nextInstructionAddress);
    this.setRegister("ip", nextInstructionAddress + 2);
    return instruction;
  }

  /**
   * Fetches the current instruction to be returned and increments the instruction pointer
   * 32-bit instruction
   * */
  public fetchCurrentInstruction32() {
    const nextInstructionAddress = this.getRegister("ip");
    if (nextInstructionAddress + 4 > this.allocatedAmount) {
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getUint32(nextInstructionAddress);
    this.setRegister("ip", nextInstructionAddress + 4);
    return instruction;
  }

  public fetchCurrentSignedInstruction32() {
    const nextInstructionAddress = this.getRegister("ip");
    if (nextInstructionAddress + 4 > this.allocatedAmount) {
      this.emptyInstructionAtStep = 9999;
      return -1;
    }
    const instruction = this.memory.getInt32(nextInstructionAddress);
    this.setRegister("ip", nextInstructionAddress + 4);
    return instruction;
  }
  fetchParameter(t: ParameterFetchType): number{
    switch(t){
      case ParameterFetchType.unsignedINT8: return this.fetchCurrentInstruction8()
      case ParameterFetchType.signedINT8: return this.fetchCurrentSignedInstruction8();
      case ParameterFetchType.unsignedINT16: return this.fetchCurrentInstruction16()
      case ParameterFetchType.unsignedINT32: return this.fetchCurrentInstruction32()
      case ParameterFetchType.signedINT32: return this.fetchCurrentSignedInstruction32();
      case ParameterFetchType.registerIndex: return this.fetchRegisterIndex()
      default: throw new Error("Incorrect register fetch type")
    }
  }

  /**
   * Yields the next instruction to be executed along with it's parameters (if any).
   * @yields [instruction, param1, param2, ...]. where the parameters are optional, but the instruction is always present.
   * */
  *fetch() {
    while(true){
      const instruction = this.fetchCurrentInstruction8() as Instructions;
      if(instruction <= 0) break;
      const params = InstructionParams[instruction]
      const arr = new Array<number>(params.length + 1);
      arr[0] = instruction; // adds the instruction to the array
      for(let i = 0; i < params.length; i++) arr[i+1] = this.fetchParameter(params[i]);
      yield arr;
    }
  }
}
