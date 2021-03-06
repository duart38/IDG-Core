import { Direction } from "../../interfaces/Actions.ts";
import { ImageData } from "../../interfaces/Image.ts";
import {RandomType} from "../Instructions/helper.ts";
import { RGB } from "../../interfaces/RGBA.ts";
import { chunkUp16, chunkUp32, compress, Uint8Constructor } from "../../utils/bits.ts";
import { combineRGB } from "../../utils/color.ts";
import { indexByCoordinates } from "../../utils/coordinates.ts";
import {
  additionType,
  multiplicationType,
  subtractionType,
} from "../Instructions/arithemetic.ts";
import { andType, orType, shiftType } from "../Instructions/bitwise.ts";
import { RGBConversionType } from "../Instructions/color.ts";
import { AccJumpType, CallType } from "../Instructions/jump.ts";
import { moveType } from "../Instructions/moving.ts";
import { LuminosityModificationType } from "../Instructions/pixelModification.ts";
import {
  NeighborRetrievalType,
  PixelColorByIndexType,
} from "../Instructions/pixelRetrieval.ts";
import { DrawLineType } from "../Instructions/shapes.ts";
import {
  InstructionParams,
  Instructions,
  ParameterFetchType,
  PUSHABLE_STATE,
  RegisterIndexOf,
  RegisterKey,
} from "../Registers.ts";
interface functionBuilderDetails {
  start: number;
  end: number;
  skipPointer: number;
}
interface IDGFunction {
  markStart: () => void;
  markEnd: () => void;
  call: () => void;
  __currentFunctionDetail: functionBuilderDetails;
}

type conditionalJump = AccJumpType;

/**
 * The Builder here takes care of easily constructing certain instructions.
 * It also keeps track of the memory requirements based on what requests are made.
 */
export default class IDGBuilder {
  public instructionIndex = 0;
  /**
     * Initial value here is allocated for the stack.
     * 4 * 100 -> stack size of 100 32-bit values.
     *
     * NOTE: Decreasing this manually might cause some serious issues..
     */
  public memoryRequirementInBytes = 4 * 100;
  private imageData: ImageData;
  private flags: Record<string, number>;
  /**
     * Represents all the functions (sub-routines with return instruction) created in this builder
     */
  private functions: Record<string, { size: number }> = {};
  public instructions: Uint8Array;
  public stackSizeRequirement = PUSHABLE_STATE.length * 4;
  /**
     *
     * @param imageData
     * @param preAllocation how much memory to pre-allocate to construct stuff
     */
  constructor(imageData: ImageData, preAllocation = 524288000 /* 500MB */) {
    this.imageData = imageData;
    this.flags = {};
    this.instructions = new Uint8Array(preAllocation);
  }

  /**
     * Sets a flag at the current instruction index (unless specifically defined) so that you can refer back to it in code later.
     * Very useful for jumping around as you don't need to remember the locations in memory.
     */
  setFlag(name: string, atIndex = this.instructionIndex) {
    if (this.flags[name]) {
      console.warn(
        `Warning: renamed flag ${name}. you may ignore if intentional`,
      );
    }
    console.info(`Registered flag '${name}' at index: ${atIndex}`);
    this.flags[name] = atIndex;
    return atIndex;
  }
  getFlag(name: string) {
    const r = this.flags[name];
    if (r === undefined || r === null) {
      throw new Error(
        `flag ${name} does not exist. flags dump -> ${
          JSON.stringify(this.flags)
        }`,
      );
    }
    return r;
  }

  /**
     * Adds a warning if the function we are calling has not been created using our internal function creation method.
     */
  private _warnIfNotAFunction(x: string | number) {
    let num = x;
    if (typeof num === "string") num = this.getFlag(num);
    if (!(num in this.functions)) {
      console.warn(
        `WARNING: Calling a function ${x} that might not have a return instruction.`,
      );
    }
  }

  /**
     * Calls the location provided. use labels to help yourself keep track of where to go.
     * NOTE!: uses the internal stack to push the current state. sub-routines called must have a return instruction to pop the state and return back to this location!.
     */
  callLocation(address: number | string): IDGBuilder {
    // TODO: liter, memory, reg?
    this.insert8(Instructions.CALL);
    this.insert8(CallType.CAL_LIT);
    this.insert32(
      typeof address === "string" ? this.getFlag(address) + 1 : address + 1,
    );
    return this;
  }

  /**
     * Calls the location of the registers value.
     * NOTE!: uses the internal stack to push the current state. sub-routines called must have a return instruction to pop the state and return back to this location!.
     */
  callLocationStoredInRegister(reg: RegisterKey) {
    this.insert8(Instructions.CALL);
    this.insert8(CallType.CAL_REG);
    this.insert32(this._regKeyToIndex(reg));
    return this;
  }
  /**
     * Insert a 32-bit instruction at the current index and then increment to point to an empty spot for the next insert
     */
  public insert32(n: number) {
    if(n < 0) { // signed val
      const dv = new DataView(this.instructions.buffer)
      dv.setInt32(this.instructionIndex, n);
    }else{
      this.instructions.set(chunkUp32(n), this.instructionIndex);
    }
    this.instructionIndex += 4;
  }
  public insert16(n: number) {
    this.instructions.set(chunkUp16(n), this.instructionIndex);
    this.instructionIndex += 2;
  }
  /**
     * Inserts a 1 byte (8bit) instruction and increments the index accordingly
     * @param n
     */
  public insert8(n: number) {
    this.instructions[this.instructionIndex++] = n;
  }

  StoreNumberToRegister(n: number, registerKey: RegisterKey): IDGBuilder {
    this.insert8(Instructions.MOVE);
    this.insert8(moveType.MOV_LIT_REG);
    this.insert32(n);
    this.insert32(this._regKeyToIndex(registerKey));
    return this;
  }
  /**
     * Move a registers value to another register.
     * @param from source
     * @param to destination
     */
  MoveRegisterValueToAnother(from: RegisterKey, to: RegisterKey) {
    this.insert8(Instructions.MOVE);
    this.insert8(moveType.MOV_REG_REG);
    this.insert32(this._regKeyToIndex(from));
    this.insert32(this._regKeyToIndex(to));
    return this;
  }
  /**
     * Move a value from memory into a register
     */
  MoveMemoryToRegister(from: number, toRegister: RegisterKey) {
    this.insert8(Instructions.MOVE);
    this.insert8(moveType.MOV_MEM_REG);
    this.insert32(from);
    this.insert32(this._regKeyToIndex(toRegister));
    return this;
  }

  /**
     * Copies the value in the supplied register to memory.
     * @param from the register to copy from
     * @param memoryLocation the memory location to put the value in (use flags to help keep track)
     */
  MoveRegisterToMemory(from: RegisterKey, to: number) {
    this.insert8(Instructions.MOVE);
    this.insert8(moveType.MOV_REG_MEM);
    this.insert32(this._regKeyToIndex(from));
    this.insert32(to);
  }

  /**
     * Stores a number into memory.
     * @param value the value to put in the location.
     * @param memoryLocation the location to put the value in (places it). places at the current instruction index if omitted
     * @returns the location where the value has been stored
     */
  StoreValueInMemory(value: number, memoryLocation?: number) {
    const location = memoryLocation || this.instructionIndex;

    this.insert8(Instructions.MOVE);
    this.insert8(moveType.MOV_LIT_MEM);
    this.insert32(value);
    this.insert32(location);
    return location;
  }

  // get required instruction size for this operation
  public _getInstructionSize(operation: ParameterFetchType) {
    switch (operation) {
      case ParameterFetchType.unsignedINT8:
        return 1;
      case ParameterFetchType.unsignedINT16:
        return 2;
      case ParameterFetchType.unsignedINT32:
        return 4;
      case ParameterFetchType.signedINT8:
        return 1;
      case ParameterFetchType.signedINT16:
        return 2;
      case ParameterFetchType.signedINT32:
        return 4;
      default:
        throw new Error("Unsupported parameter fetch type");
    }
  }

  private _skip(instructionsToSkip: Instructions[], extraBytes = 0) {
    const skipTo = instructionsToSkip
      .reduce(
        (prev, curr) =>
          prev +
          InstructionParams[curr].reduce((p, c) =>
            p + this._getInstructionSize(c), 0),
        0,
      ) + 1;
    this.insert8(Instructions.SKIP);
    this.insert32(skipTo + extraBytes);
  }

  public _regKeyToIndex(x: RegisterKey) {
    return RegisterIndexOf[x] * 4;
  }

  /**
     * Adds values together from various places, depending on if you give this method a register name or a number.
     * NOTE: the result of this calculation is stored in the accumulator register ("acc").
     * @param lhs the register name (that contains the value you want to add), or a literal number value to add to the rhs register
     * @param rhs the register name to
     */
  addValues(lhs: RegisterKey | number, rhs: RegisterKey) {
    if (typeof lhs === "string" && typeof rhs === "string") { // ADD_REG_REG
      this.insert8(Instructions.ADD);
      this.insert8(additionType.ADD_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "number" && typeof rhs === "string") { // ADD_LIT_REG
      this.insert8(Instructions.ADD);
      this.insert8(additionType.ADD_LIT_REG);
      this.insert32(lhs);
      this.insert32(this._regKeyToIndex(rhs));
    }

    return this;
  }

  /**
     * Subtract 2 values from each other. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: all results are stored in the accumulator register ("acc")
     * @param lhs the register to take the value from or a literal number
     * @param rhs the register to take the value from or a literal number
     */
  subtractValues(lhs: RegisterKey | number, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { //SUB_REG_REG
      this.insert8(Instructions.SUBTRACT);
      this.insert8(subtractionType.SUB_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "number" && typeof rhs === "string") { //SUB_LIT_REG
      this.insert8(Instructions.SUBTRACT);
      this.insert8(subtractionType.SUB_LIT_REG);
      this.insert32(lhs);
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { //SUB_REG_LIT
      this.insert8(Instructions.SUBTRACT);
      this.insert8(subtractionType.SUB_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Multiply values. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: all results are stored in the accumulator register ("acc")
     * @param lhs the register to take the value from or a literal number
     * @param rhs the register to take the value from
     */
  multiplyValues(lhs: RegisterKey | number, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // MUL_REG_REG
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "number" && typeof rhs === "string") { // MUL_LIT_REG
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_LIT_REG);
      this.insert32(lhs);
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // MUL_REG_LIT
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    } else if (typeof lhs === "number" && typeof rhs === "number") { // MUL_LIT_LIT
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_LIT_LIT);
      this.insert32(lhs);
      this.insert32(rhs);
    }
    return this;
  }

  // multiply memory to register
  multiplyMemoryToRegister(
    lhs: number | RegisterKey,
    rhs: RegisterKey | number,
  ) {
    if (typeof lhs === "number" && typeof rhs === "string") { // MUL_MEM_REG
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_MEM_REG);
      this.insert32(lhs);
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // MUL_REG_MEM
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_REG_MEM);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    } else if (typeof lhs === "number" && typeof rhs === "number") { // MUL_MEM_MEM
      this.insert8(Instructions.MULTIPLY);
      this.insert8(multiplicationType.MUL_MEM_MEM);
      this.insert32(lhs);
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Left shifts (<<) 2 values. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the lhs paramter
     * @param lhs the left hand side of the shift operator and also where the resulting value is stored.
     * @param rhs value to shift by could be a register (will retrieve the value) or a literal number
     */
  leftShiftValues(lhs: RegisterKey, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // LSF_REG_REG
      this.insert8(Instructions.BITWISE_SHIFT);
      this.insert8(shiftType.LSF_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // LSF_REG_LIT
      this.insert8(Instructions.BITWISE_SHIFT);
      this.insert8(shiftType.LSF_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * right shifts (>>) 2 values. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the lhs paramter
     * @param lhs the left hand side of the shift operator and also where the resulting value is stored.
     * @param rhs value to shift by could be a register (will retrieve the value) or a literal number
     */
  rightShiftValues(lhs: RegisterKey, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // RSF_REG_REG
      this.insert8(Instructions.BITWISE_SHIFT);
      this.insert8(shiftType.RSF_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // RSF_REG_LIT
      this.insert8(Instructions.BITWISE_SHIFT);
      this.insert8(shiftType.RSF_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Performs a bitwise AND (&)takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the accumulator register ("acc").
     * @param lhs the left hand side of the AND operator
     * @param rhs value to AND by, could be a register (will retrieve the value) or a literal number
     */
  bitwiseAND(lhs: RegisterKey, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // AND_REG_REG
      this.insert8(Instructions.BITWISE_AND);
      this.insert8(andType.AND_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // AND_REG_LIT
      this.insert8(Instructions.BITWISE_AND);
      this.insert8(andType.AND_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Performs a bitwise OR. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the accumulator register ("acc").
     * @param lhs the left hand side of the OR operator
     * @param rhs value to OR by, could be a register (will retrieve the value) or a literal number
     */
  bitwiseOR(lhs: RegisterKey, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // OR_REG_REG
      this.insert8(Instructions.BITWISE_OR);
      this.insert8(orType.OR_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // OR_REG_LIT
      this.insert8(Instructions.BITWISE_OR);
      this.insert8(orType.OR_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Performs a bitwise XOR. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the accumulator register ("acc").
     * @param lhs the left hand side of the XOR operator
     * @param rhs value to XOR by, could be a register (will retrieve the value) or a literal number
     */
  bitwiseXOR(lhs: RegisterKey, rhs: RegisterKey | number) {
    if (typeof lhs === "string" && typeof rhs === "string") { // XOR_REG_REG
      this.insert8(Instructions.BITWISE_OR);
      this.insert8(orType.XOR_REG_REG);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(this._regKeyToIndex(rhs));
    } else if (typeof lhs === "string" && typeof rhs === "number") { // XOR_REG_LIT
      this.insert8(Instructions.BITWISE_OR);
      this.insert8(orType.XOR_REG_LIT);
      this.insert32(this._regKeyToIndex(lhs));
      this.insert32(rhs);
    }
    return this;
  }

  /**
     * Performs a bitwise NOT and stores the value in the accumulator ("acc")
     * NOTE: stores the value in the accumulator register ("acc").
     * @param reg the register to apply the operator on
     */
  bitwiseNOT(reg: RegisterKey) {
    this.insert8(Instructions.NOT);
    this.insert32(this._regKeyToIndex(reg));
    return this;
  }

  /**
     * Jumps to a specified location if the value provided is not equal to the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. use flags to help keep track of where to jump to
     * @param val the value to check against the register
     */
  JumpIfNotEquals(jumpTo: number | string, val: RegisterKey | number) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof val === "string") { // JNE_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JNE_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { //JMP_NOT_EQ
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JNE_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }

  /**
     * Jumps to a specified location if the value provided is equal to the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. pass in a string to automatically get a saved flag
     * @param val the value to check against the register
     */
  JumpIfEquals(
    jumpTo: number | string | IDGFunction,
    val: RegisterKey | number,
  ) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof jumpTo !== "number") {
      // TODO: next error is here, we pre-maturely push but what if it is false? we obviously don't pop...
      //this.pushInstructionPointerWithOffset(this._sizeOf(Instructions.JGT_REG) + 1);
      jumpTo = jumpTo.__currentFunctionDetail.start;
    }
    if (typeof val === "string") { // JEQ_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JEQ_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { // JEQ_LIT
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JEQ_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }

  /**
     * Jumps to a specified location if the value provided is less than the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. pass in a string to automatically get a saved flag
     * @param val the value to check against the register
     */
  JumpIfLessThan(
    jumpTo: number | string | IDGFunction,
    val: RegisterKey | number,
  ) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof jumpTo !== "number") {
      // TODO: next error is here, we pre-maturely push but what if it is false? we obviously don't pop...
      // this.pushInstructionPointerWithOffset(this._sizeOf(Instructions.JGT_REG) + 1);
      jumpTo = jumpTo.__currentFunctionDetail.start;
    }
    if (typeof val === "string") { // JLT_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JLT_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { // JLT_LIT
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JLT_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }
  /**
     * Jumps to a specified location if the value provided is greater than the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. pass in a string to automatically get a saved flag
     * @param val the value to check against the register
     */
  JumpIfGreaterThan(
    jumpTo: number | string | IDGFunction,
    val: RegisterKey | number,
  ) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof jumpTo !== "number") {
      // TODO: next error is here, we pre-maturely push but what if it is false? we obviously don't pop...
      // this.pushInstructionPointerWithOffset(this._sizeOf(Instructions.JGT_REG) + 1);
      jumpTo = jumpTo.__currentFunctionDetail.start;
    }
    if (typeof val === "string") { // JGT_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JGT_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { // JGT_LIT
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JGT_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }

  /**
     * Jumps to a specified location if the value provided is less than or equal to the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. pass in a string to automatically get a saved flag
     * @param val the value to check against the register
     */
  JumpIfLessThanOrEqual(jumpTo: number | string, val: RegisterKey | number) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof val === "string") { // JLE_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JLE_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { // JLE_LIT
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JLE_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }

  /**
     * Jumps to a specified location if the value provided is less than or equal to the one currently stored in the accumulator register ("acc").
     * NOTE: this method does not push the state so calling a method with a return instruction (function) could be problematic
     * @param jumpTo address to jump to. pass in a string to automatically get a saved flag
     * @param val the value to check against the register
     */
  JumpIfGreaterThanOrEqual(jumpTo: number | string, val: RegisterKey | number) {
    if (typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
    if (typeof val === "string") { // JGE_REG
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JGE_REG);
      this.insert32(this._regKeyToIndex(val));
      this.insert32(jumpTo);
    } else { // JGE_LIT
      this.insert8(Instructions.JMP_ACC);
      this.insert8(AccJumpType.JGE_LIT);
      this.insert32(val);
      this.insert32(jumpTo);
    }
    return this;
  }

  /**
     * Pushes a register value or a literal number to the stack
     * @param val
     */
  pushToStack(val: RegisterKey | number) {
    if (typeof val === "string") { // PSH_REG
      val = this._regKeyToIndex(val);
      this.insert8(Instructions.PSH_REG);
      this.insert32(val);
    } else { // PSH_LIT
      this.insert8(Instructions.PSH_LIT);
      this.insert32(val);
    }
    this.stackSizeRequirement += 4;
    return this;
  }

  /**
     * Saves the machines state (register values) in the stack. this can be popped later to return to the machine at the time that it was saved.
     */
  saveMachineState() {
    this.insert8(Instructions.PSH_STATE);
    return this;
  }

  /**
     * Pops the last value added to the stack and stores it in the given register.
     */
  popStack(storeIn: RegisterKey) {
    this.insert8(Instructions.POP);
    this.insert32(this._regKeyToIndex(storeIn));
    return this;
  }

  /**
     * Skips the following instructions (size is calculated).
     * NOTE: this does not define the instructions themselves. the array is only used for calculating where to skip to.
     * @param name used to store a "flag" in a temporary helper table that can be used to call this skipped instruction later. @see {callFunction}
     */
  skipInstructions(
    name: string,
    instructionsToSkip: Instructions[],
  ): IDGBuilder {
    const skipTo = instructionsToSkip.reduce(
      (prev, curr) =>
        prev +
        InstructionParams[curr].reduce((p, c) =>
          p + this._getInstructionSize(c), 1),
      0,
    );
    this.insert8(Instructions.SKIP);
    this.setFlag(name);
    this.insert32(skipTo);
    return this;
  }

  /**
     * Return from a sub-routine (function)
     * @param toAddressBelow indicated wether we should return and re-call the last instruction or skip to the next instruction
     */
  return(toAddressBelow = true): IDGBuilder {
    if (toAddressBelow)this.insert8(Instructions.RET_TO_NEXT);
    else this.insert8(Instructions.RET);
    return this;
  }

  /**
     * Stops the VM from executing.
     */
  HALT() {
    this.insert8(Instructions.HLT);
    return this;
  }

  /**
     * Gets a random value in between and including the start and the end provided. stores the results in the accumulator register ("acc")
     */
  getRandomValue(min: number, max: number) {
    this.insert8(Instructions.RAND);
    this.insert8(RandomType.RAND_LIT_LIT);
    this.insert32(min);
    this.insert32(max);
    return this;
  }

  /**
     * Gets the values stored in the register: "x", "y", "COL". if color paramter is supplied the value is overridden instead
     * x and y are the coordinates
     * COL is the color value
     */
  modifyPixel(color?: number | RGB) {
    if (color && typeof color === "number") {
      this.StoreNumberToRegister(color, "COL");
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    } else if (color && Array.isArray(color)) { // array [r,g,b]
      this.insert8(Instructions.RGB_TO_COLOR);
      this.insert8(RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT);
      this.insert32(color[0]);
      this.insert32(color[1]);
      this.insert32(color[2]);
      
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    } else {
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    }
    return this;
  }

  modifyPixelAt(x: number, y: number, color?: number | RGB) {
    this.StoreNumberToRegister(x, "x");
    this.StoreNumberToRegister(y, "y");
    if (color && typeof color === "number") {
      this.StoreNumberToRegister(color, "COL");
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    } else if (color && Array.isArray(color)) { // array [r,g,b]
      this.insert8(RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT);
      this.insert8(color[0]);
      this.insert8(color[1]);
      this.insert8(color[2]);
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    } else {
      this.insert8(Instructions.MODIFY_PIXEL_REG);
    }
    return this;
  }

  fetchPixelIndexByRegisterCoordinates(storeIn: RegisterKey) {
    this.insert8(Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES);
    this.insert32(this._regKeyToIndex(storeIn));
  }

  /**
     * Converts RGB from a register (if no value provided) or a literal (if you provide it directly) and stores it in the color register ("COL")
     * @param val RGB value. if none is provided it gets the values from the register instead.
     */
  RGBToColor(val?: RGB) {
    if (val) {
      this.insert8(RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT);
      this.insert8(val[0]);
      this.insert8(val[1]);
      this.insert8(val[2]);
    } else {
      this.insert8(Instructions.RGB_FROMREG_TO_COLOR);
    }
    return this;
  }

  /**
     * Draws a rectangle.
     * If x,y or color is not defined these values are fetched from the register. if defined they are first added to the register (replacing the value currently there) and then this method is executed
     * @param width
     * @param height
     * @param x
     * @param y
     * @param color
     */
  drawRectangle(
    width: number,
    height: number,
    x?: number,
    y?: number,
    color?: number | RGB,
  ) {
    if (x) this.StoreNumberToRegister(x, "x");
    if (y) this.StoreNumberToRegister(y, "y");
    if (color) {
      if (Array.isArray(color)) color = combineRGB(color);
      this.StoreNumberToRegister(color, "COL");
    }
    // DRAW_BOX
    this.insert8(Instructions.DRAW_BOX);
    this.insert32(width);
    this.insert32(height);
    return this;
  }

  drawLineReg(
    point1: [RegisterKey, RegisterKey],
    point2: [RegisterKey, RegisterKey],
  ) {
    this.insert8(Instructions.DRAW_LINE_POINTS);
    this.insert8(DrawLineType.DRAW_LINE_P1REG_P2REG);
    this.insert32(this._regKeyToIndex(point1[0]));
    this.insert32(this._regKeyToIndex(point1[1]));

    this.insert32(this._regKeyToIndex(point2[0]));
    this.insert32(this._regKeyToIndex(point2[1]));
  }
  drawLineLit(point1: [number, number], point2: [number, number]) {
    this.insert8(Instructions.DRAW_LINE_POINTS);
    this.insert8(DrawLineType.DRAW_LINE_P1LIT_P2LIT);
    this.insert16(point1[0]);
    this.insert16(point1[1]);

    this.insert16(point2[0]);
    this.insert16(point2[1]);
  }

  drawCircle(radius: number, x?: number, y?: number, color?: number | RGB) {
    if (x) this.StoreNumberToRegister(x, "x");
    if (y) this.StoreNumberToRegister(y, "y");
    if (color) {
      if (Array.isArray(color)) color = combineRGB(color);
      this.StoreNumberToRegister(color, "COL");
    }
    // DRAW_BOX
    this.insert8(Instructions.DRAW_CIRCLE);
    this.insert32(radius);
    return this;
  }
  ModifyPixelLuminosity(by: RegisterKey | number, x?: number, y?: number) {
    if (x) this.StoreNumberToRegister(x, "x");
    if (y) this.StoreNumberToRegister(y, "y");
    //LuminosityModificationType
    this.insert8(Instructions.MODIFY_LUMINOSITY);
    this.insert8(
      typeof by === "string"
        ? LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_REG
        : LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_LIT,
    );
    this.insert32(typeof by === "string" ? this._regKeyToIndex(by) : by);
  }

  modifyImageLuminosity(by: RegisterKey | number) {
    this.insert8(Instructions.MODIFY_LUMINOSITY);
    this.insert8(
      typeof by === "string"
        ? LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_REG
        : LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_LIT,
    );
    this.insert32(typeof by === "string" ? this._regKeyToIndex(by) : by);
  }


  SLEEP(ms: number) {
    this.insert8(Instructions.SLEEP);
    this.insert32(ms);
  }

  GOTO(address: string | number) {
    if (typeof address === "string") address = this.getFlag(address);
    this.insert8(Instructions.GOTO);
    this.insert32(address);
  }

  functionBuilder(): IDGFunction {
    const currentFunctionDetail: {
      start: number;
      end: number;
      skipPointer: number;
    } = {
      start: -1,
      end: -1,
      skipPointer: 0,
    };
    const call = () => {
      //this.GOTO(currentFunctionDetail.start);
      if (
        currentFunctionDetail.start === -1 || currentFunctionDetail.end === -1
      ) {
        throw new Error(`function not constructed properly`);
      }
      // this.insert8(Instructions.CAL_LIT);
      this.insert8(Instructions.CALL);
      this.insert8(CallType.CAL_LIT);
      this.insert32(currentFunctionDetail.start);
    };
    return {
      markStart: () => this.$_startFunction(currentFunctionDetail),
      markEnd: () => this.$_endFunction(currentFunctionDetail),
      call,
      __currentFunctionDetail: currentFunctionDetail,
    };
  }
  private $_startFunction(currentFunctionDetail: functionBuilderDetails) {
    this.insert8(Instructions.SKIP);
    currentFunctionDetail.skipPointer = this.instructionIndex; // set 32 here to replace
    this.insert32(0); // will be changed later by the end function
    currentFunctionDetail.start = this.instructionIndex; // start of function instructions. jump to here
    return () => this.$_endFunction(currentFunctionDetail);
  }

  private $_endFunction(details: functionBuilderDetails) {
    this.insert8(Instructions.RET);

    details.end = this.instructionIndex;
    this.instructions.set(
      chunkUp32(details.end - details.start),
      details.skipPointer,
    ); // set back the amount we need to skip to cover this entire function
  }

  loopBuilder(condition: conditionalJump, value: RegisterKey | number) {
    const currentFunctionDetail: {
      start: number;
      end: number;
      condition: conditionalJump;
      value: RegisterKey | number;
    } = {
      start: 0,
      end: 0,
      condition,
      value,
    };
    return {
      markStart: () => this.$_startLoop(currentFunctionDetail),
      markEnd: () => this.$_endLoop(currentFunctionDetail),
      __currentFunctionDetail: currentFunctionDetail,
    };
  }
  private $_startLoop(
    details: {
      start: number;
      end: number;
      condition: conditionalJump;
      value: RegisterKey | number;
    },
  ) {
    details.start = this.instructionIndex; // start of function instructions. jump to here
    this.pop("r7"); // TODO: change this... the problem is that i call jumps below that push to stack without popping (memory leak)
  }
  private $_endLoop(
    details: {
      start: number;
      end: number;
      condition: conditionalJump;
      value: RegisterKey | number;
    },
  ) {
    switch (details.condition) {
      case AccJumpType.JNE_LIT:
      case AccJumpType.JNE_REG:
        this.JumpIfNotEquals(details.start, details.value);
        break;
      case AccJumpType.JEQ_REG:
      case AccJumpType.JEQ_LIT:
        this.JumpIfEquals(details.start, details.value);
        break;
      case AccJumpType.JLT_REG:
      case AccJumpType.JLT_LIT:
        this.JumpIfLessThan(details.start, details.value);
        break;
      case AccJumpType.JGT_REG:
      case AccJumpType.JGT_LIT:
        this.JumpIfGreaterThan(details.start, details.value);
        break;
      case AccJumpType.JLE_REG:
      case AccJumpType.JLE_LIT:
        this.JumpIfLessThanOrEqual(details.start, details.value);
        break;
      case AccJumpType.JGE_REG:
      case AccJumpType.JGE_LIT:
        this.JumpIfGreaterThanOrEqual(details.start, details.value);
        break;
    }
  }

  debug(id: number) {
    this.insert8(Instructions.DEBUG);
    this.insert8(id);
  }

  langtonsAnt(
    clockColor: number,
    antiClockColor: number,
    at?: [number, number],
  ) {
    if (at) {
      this.StoreNumberToRegister(at[0], "x");
      this.StoreNumberToRegister(at[1], "y");
    }
    this.insert8(Instructions.LANGTONS_ANT);
    this.insert32(clockColor);
    this.insert32(antiClockColor);
  }

  seeds(onColor: number, offColor: number) {
    this.insert8(Instructions.SEEDS);
    this.insert32(onColor);
    this.insert32(offColor);
  }

  pushInstructionPointer() {
    this.insert8(Instructions.PSH_IP);
  }
  pushInstructionPointerWithOffset(offsetBy: number) {
    this.insert8(Instructions.PSH_IP_OFFSETTED);
    this.insert32(offsetBy);
  }

  push(regOrLit: RegisterKey | number) {
    if (typeof regOrLit === "string") {
      this.insert8(Instructions.PSH_REG);
      this.insert32(this._regKeyToIndex(regOrLit));
    } else {
      this.insert8(Instructions.PSH_LIT);
      this.insert32(regOrLit);
    }
  }
  pop(regOrLit: RegisterKey) {
    this.insert8(Instructions.POP);
    this.insert32(this._regKeyToIndex(regOrLit));
  }

  /**
     * calls some function repeatedly on the given interval.
     * NOTE: the called function should probably have a RET (return) instruction or else it will never pop the stack.. use the helper method here to build a function with a return statement
     * @param timeInMs
     * @param callFunction the flag name (function name) or a number representing an address to call
     */
  atInterval(
    timeInMs: number,
    callFunction: string | number | IDGFunction,
  ): IDGBuilder {
    if (typeof callFunction === "string") {
      callFunction = this.getFlag(callFunction);
    }
    this.insert8(Instructions.INTERVAL);
    this.insert32(timeInMs);
    this.insert32(
      typeof callFunction === "number"
        ? callFunction
        : callFunction.__currentFunctionDetail.start,
    );
    return this;
  }

  incrementRegister(reg: RegisterKey): IDGBuilder {
    this.insert8(Instructions.INC_REG);
    this.insert32(this._regKeyToIndex(reg));
    return this;
  }
  decrementRegister(reg: RegisterKey) {
    this.insert8(Instructions.DEC_REG);
    this.insert32(this._regKeyToIndex(reg));
    return this;
  }

  /**
     * Renders the image.
     */
  RENDER() {
    this.insert8(Instructions.RENDER);
    return this;
  }

  /**
     * Gets the pixel index in a given direction from the perspective of the supplied pixel or register containing the pixel and either stores it in the register supplied as the storage location.
     * @param direction the direction from the current pixel to get the value of
     * @param fromPixel the current pixel (directions are applied from the perspective of this pixel)
     * @param RegisterToStoreIn the register to store the result in
     */
  getNeighboringPixelIndex(
    direction: Direction,
    fromPixel: number | [number, number] | RegisterKey,
    RegisterToStoreIn: RegisterKey,
  ) {
    if (Array.isArray(fromPixel)) {
      fromPixel = indexByCoordinates(
        fromPixel[0],
        fromPixel[1],
        this.imageData.width,
      );
    }
    if (typeof fromPixel === "string") {
      this.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
      this.insert8(
        NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG,
      );
      this.insert8(direction);
      this.insert32(this._regKeyToIndex(fromPixel));
      this.insert32(this._regKeyToIndex(RegisterToStoreIn));
    } else {
      this.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
      this.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
      this.insert8(direction);
      this.insert32(fromPixel);
      this.insert32(this._regKeyToIndex(RegisterToStoreIn));
    }
    return this;
  }

  /**
     * Fetches the pixel color and stores it in the color register
     * @param atLocation
     */
  fetchPixelColor(
    atLocation: number | [number, number] | RegisterKey,
    storeInReg: RegisterKey,
  ) {
    if (Array.isArray(atLocation)) {
      atLocation = indexByCoordinates(
        atLocation[0],
        atLocation[1],
        this.imageData.width,
      );
    } else if (typeof atLocation === "string") {
      this.insert8(Instructions.FETCH_PIXEL_COLOR_BY_INDEX);
      this.insert8(PixelColorByIndexType.FETCH_PIXEL_COLOR_REG);
      atLocation = this._regKeyToIndex(atLocation);
    } else {
      this.insert8(Instructions.FETCH_PIXEL_COLOR_BY_INDEX);
      this.insert8(PixelColorByIndexType.FETCH_PIXEL_COLOR_LIT);
    }
    this.insert32(atLocation); // where to check
    this.insert32(this._regKeyToIndex(storeInReg)); // where to store
    return this;
  }

  /**
     * Returns the amount of memory that the code will consume at the point in time of when you execute this method.
     * @returns
     */
  currentHeapSize() {
    return this.memoryRequirementInBytes + this.instructionIndex +
      this.stackSizeRequirement;
  }
  compile() {
    console.log("COMPILING:");
    console.log(`
        TOTAL MEM: ${this.currentHeapSize()} bytes
        INSTR MEM: ${this.instructionIndex} bytes
        IMAGE MEM (allocated separately): ${(this.imageData.width *
      this.imageData.height) * 4} bytes
        STACK ALLOCATION: ${this.stackSizeRequirement}
        `);

    if (
      this.imageData.width > 0x7FFFFFFF || this.imageData.height > 0x7FFFFFFF
    ) {
      throw new Error(`Memory limit reached. maximum: ${0x7FFFFFFF}`);
    }
    if (this.currentHeapSize() > 0x7FFFFFFF) {
      console.warn(
        `WARNING: Current head size is longer than ${0x7FFFFFFF}, memory locations after this value cannot be referenced by instructions. instructions will still run`,
      );
    }

    const header8Bit = new Uint8Array([
      ...chunkUp32(this.imageData.width),
      ...chunkUp32(this.imageData.height),
      ...chunkUp32(this.currentHeapSize()),
      ...chunkUp32(this.stackSizeRequirement),
    ]);
    const image8Bit = new Uint8Array(this.imageData.imageData.length * 4);
    for (let i = 0, k = 0; i < image8Bit.length; i += 4, k++) {
      const [first, second, third, fourth] = chunkUp32(
        this.imageData.imageData[k],
      );
      image8Bit[i] = first;
      image8Bit[i + 1] = second;
      image8Bit[i + 2] = third;
      image8Bit[i + 3] = fourth;
    }

    const file = new Uint8Constructor(
      header8Bit.length + image8Bit.length + this.currentHeapSize(),
    );
    file.setNext(header8Bit);
    file.setNext(image8Bit);
    file.setNext(this.instructions.slice(0, this.instructionIndex + 1));

    const compressed = compress(file.getData());
    console.log(`\t Final file size: ${compressed.byteLength} bytes`);
    return compressed;
  }
}