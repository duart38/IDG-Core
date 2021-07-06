import { ImageData } from "../../interfaces/Image.ts";
import { chunkUp32 } from "../../utils/bits.ts";
import { InstructionInformation, Instructions, RegisterIndexOf, RegisterKey } from "../Registers.ts";

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
    private functions: string[] = [];
    public instructions: Uint8Array;
    /**
     * 
     * @param imageData 
     * @param preAllocation how much memory to pre-allocate to construct stuff
     */
    constructor(imageData: ImageData, preAllocation = 524288000 /* 500MB */){
        this.imageData = imageData;
        this.flags = {};
        this.instructions = new Uint8Array(preAllocation)
    }
    //TODO: all instructions here... along with some other ones that group some instructions\

    /**
     * Sets a flag at the current instruction index (unless specifically defined) so that you can refer back to it in code later.
     * Very useful for jumping around as you don't need to remember the locations in memory.
     */
    setFlag(name: string, atIndex = this.instructionIndex): IDGBuilder{
        if(this.flags[name]) console.warn(`Warning: renamed flag ${name}. you may ignore if intentional`);
        this.flags[name] = atIndex;
        return this;
    }
    getFlag(name: string){
        const r = this.flags[name];
        if(r === undefined || r === null) throw new Error(`flag ${name} does not exist. flags dump -> ${JSON.stringify(this.flags)}`);
        return r;
    }

    /**
     * Calls a skipped instruction.
     * Skipped instructions are also known as functions as they are not evaluated unless called upon.
     * if the called instruction does not have an end (i.e. RET) then it will continue from there
     */
    callSkippedOrFunction(name: string): IDGBuilder {
        const r = this.flags[name];
        if(!r) throw new Error(`skipped instruction flag ${name} does not exist.`);
        this.callLocation(r);
        return this;
    }

    /**
     * Adds a warning if the function we are calling has not been created using our internal function creation method.
     */
    private _warnIfNotAFunction(x: string | number){
        let num = x;
        if(typeof num === "string") num = this.getFlag(num);
        if(!(num in this.functions)) console.warn(`WARNING: Calling a function ${x} that might not have a return instruction.`)
    }

    /**
     * Calls the location provided. use labels to help yourself keep track of where to go.
     * NOTE!: uses the internal stack to push the current state. sub-routines called must have a return instruction to pop the state and return back to this location!.
     */
    callLocation(address: number | string): IDGBuilder{
        this._warnIfNotAFunction(address);
        this.insert8(Instructions.CAL_LIT);
        this.insert32(typeof address === "string" ? this.getFlag(address) : address);
        return this;
    }
    /**
     * Insert a 32-bit instruction at the current index and then increment to point to an empty spot for the next insert
     */
    private insert32(n: number){
        this.instructions.set(chunkUp32(n), this.instructionIndex);
        this.instructionIndex += 4;
    }
    /**
     * Inserts a 1 byte (8bit) instruction and increments the index accordingly
     * @param n 
     */
    private insert8(n: number){
        this.instructions[this.instructionIndex++] = n;
    }

    StoreNumberToRegister(n: number, registerIndex: RegisterIndexOf): IDGBuilder{
        this.insert8(Instructions.MOV_LIT_REG);
        this.insert32(n);
        this.insert32(registerIndex);
        return this;
    }
    /**
     * Move a registers value to another register.
     * @param from source
     * @param to destination
     */
    MoveRegisterValueToAnother(from: RegisterIndexOf, to: RegisterIndexOf){
        this.insert8(Instructions.MOV_REG_REG);
        this.insert32(from);
        this.insert32(to);
        return this;
    }
    /**
     * Move a value from memory into a register
     */
    MoveMemoryToRegister(from: number, toRegister: RegisterIndexOf){
        this.insert8(Instructions.MOV_MEM_REG);
        this.insert32(from);
        this.insert32(toRegister);
        return this;
    }
    /**
     * Copies the value in the supplied register to memory.
     * @param from the register to copy from
     * @param memoryLocation the memory location to put the value in (use flags to help keep track)
     * @param safeCopy defines wether to ensure that the VM always skips this value. If no skipping is applied it is possible to corrupt (or change) the memory of instructions that are in the supplied memory location. (skipping takes up more memory, ~5bytes)
     */
    MoveRegisterToMemory(from: RegisterIndexOf, memoryLocation: number, safeCopy = true){
        if(safeCopy === true){
            this._skip([Instructions.MOV_REG_MEM])
        }
        this.insert8(Instructions.MOV_REG_MEM);
        this.insert32(from);
        this.insert32(memoryLocation);
        return this;
    }

    /**
     * Stores a number into memory.
     * @param value the value to put in the location.
     * @param memoryLocation the location to put the value in
     * @param safeCopy defines wether to ensure that the VM always skips this value. If no skipping is applied it is possible to corrupt (or change) the memory of instructions that are in the supplied memory location. (skipping takes up more memory, ~5bytes)
     */
    StoreValueInMemory(value: number, memoryLocation: number, safeCopy = true){
        if(safeCopy === true){
            this._skip([Instructions.MOV_LIT_MEM])
        }
        this.insert8(Instructions.MOV_LIT_MEM);
        this.insert32(value);
        this.insert32(memoryLocation);
        return this;
    }

    private _skip(instructionsToSkip: Instructions[]){
        const skipTo = instructionsToSkip.reduce((prev, curr)=> prev + InstructionInformation[curr].size, 0);
        this.insert8(Instructions.SKIP)
        this.insert32(skipTo);
    }


    private _regKeyToIndex(x: RegisterKey){
        return RegisterIndexOf[x];
    }

    /**
     * Adds values together from various places, depending on if you give this method a register name or a number.
     * NOTE: the result of this calculation is stored in the accumulator register ("acc").
     * @param lhs the register name (that contains the value you want to add), or a literal number value to add to the rhs register
     * @param rhs the register name to
     */
    addValues(lhs: RegisterKey | number, rhs: RegisterKey){
        if(typeof lhs === "string" && typeof rhs === "string"){ // ADD_REG_REG
            this.insert8(Instructions.ADD_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "number" && typeof rhs === "string"){ // ADD_LIT_REG
            this.insert8(Instructions.ADD_LIT_REG);
            this.insert32(lhs)
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
    subtractValues(lhs: RegisterKey | number, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ //SUB_REG_REG
            this.insert8(Instructions.SUB_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "number" && typeof rhs === "string"){ //SUB_LIT_REG
            this.insert8(Instructions.SUB_LIT_REG);
            this.insert32(lhs);
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ //SUB_REG_LIT
            this.insert8(Instructions.SUB_LIT_REG);
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
    multiplyValues(lhs: RegisterKey | number, rhs: RegisterKey){
       if(typeof lhs === "string" && typeof rhs === "string"){ // MUL_REG_REG
            this.insert8(Instructions.MUL_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
       }else if(typeof lhs === "number" && typeof rhs === "string"){ // MUL_LIT_REG
            this.insert8(Instructions.MUL_LIT_REG);
            this.insert32(lhs);
            this.insert32(this._regKeyToIndex(rhs));
       }
       return this;
    }

    /**
     * Left shifts (<<) 2 values. takes the values in the appropriate location based on what type of parameter you supply.
     * NOTE: Always stores the value in the lhs paramter
     * @param lhs the left hand side of the shift operator and also where the resulting value is stored.
     * @param rhs value to shift by could be a register (will retrieve the value) or a literal number
     */
    leftShiftValues(lhs: RegisterKey, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ // LSF_REG_REG
            this.insert8(Instructions.LSF_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ // LSF_REG_LIT
            this.insert8(Instructions.LSF_REG_LIT);
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
    rightShiftValues(lhs: RegisterKey, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ // RSF_REG_REG
            this.insert8(Instructions.RSF_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ // RSF_REG_LIT
            this.insert8(Instructions.RSF_REG_LIT);
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
    bitwiseAND(lhs: RegisterKey, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ // AND_REG_REG
            this.insert8(Instructions.AND_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ // AND_REG_LIT
            this.insert8(Instructions.AND_REG_LIT);
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
    bitwiseOR(lhs: RegisterKey, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ // OR_REG_REG
            this.insert8(Instructions.OR_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ // OR_REG_LIT
            this.insert8(Instructions.OR_REG_LIT);
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
     bitwiseXOR(lhs: RegisterKey, rhs: RegisterKey | number){
        if(typeof lhs === "string" && typeof rhs === "string"){ // XOR_REG_REG
            this.insert8(Instructions.XOR_REG_REG);
            this.insert32(this._regKeyToIndex(lhs));
            this.insert32(this._regKeyToIndex(rhs));
        }else if(typeof lhs === "string" && typeof rhs === "number"){ // XOR_REG_LIT
            this.insert8(Instructions.XOR_REG_LIT);
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
    bitwiseNOT(reg: RegisterKey){
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
    JumpIfNotEquals(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JNE_REG
            this.insert8(Instructions.JNE_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ //JMP_NOT_EQ
            this.insert8(Instructions.JMP_NOT_EQ)
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
    JumpIfEquals(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JEQ_REG
            this.insert8(Instructions.JEQ_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ // JEQ_LIT
            this.insert8(Instructions.JEQ_LIT)
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
    JumpIfLessThan(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JLT_REG
            this.insert8(Instructions.JLT_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ // JLT_LIT
            this.insert8(Instructions.JLT_LIT)
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
    JumpIfGreaterThan(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JGT_REG
            this.insert8(Instructions.JGT_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ // JGT_LIT
            this.insert8(Instructions.JGT_LIT)
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
    JumpIfLessThanOrEqual(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JLE_REG
            this.insert8(Instructions.JLE_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ // JLE_LIT
            this.insert8(Instructions.JLE_LIT)
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
    JumpIfGreaterThanOrEqual(jumpTo: number | string, val: RegisterKey | number){
        if(typeof jumpTo === "string") jumpTo = this.getFlag(jumpTo);
        if(typeof val === "string"){ // JGE_REG
            this.insert8(Instructions.JGE_REG)
            this.insert32(this._regKeyToIndex(val));
            this.insert32(jumpTo);
        }else{ // JGE_LIT
            this.insert8(Instructions.JGE_LIT)
            this.insert32(val);
            this.insert32(jumpTo);
        }
        return this;
    }

    /**
     * Pushes a register value or a literal number to the stack
     * @param val 
     */
    pushToStack(val: RegisterKey | number){
        if(typeof val === "string"){ // PSH_REG
            val = this._regKeyToIndex(val);
            this.insert8(Instructions.PSH_REG);
            this.insert32(val);
        }else{ // PSH_LIT
            this.insert8(Instructions.PSH_LIT);
            this.insert32(val);
        }
        return this;
    }


    /**
     * Skips the following instructions (size is calculated).
     * NOTE: this does not define the instructions themselves. the array is only used for calculating where to skip to.
     * @param name used to store a "flag" in a temporary helper table that can be used to call this skipped instruction later. @see {callFunction}
     */
    skipInstructions(name: string, instructionsToSkip: Instructions[]): IDGBuilder {
        this.setFlag(name);
        const skipTo = instructionsToSkip.reduce((prev, curr)=> prev + InstructionInformation[curr].size, 0);
        this.insert8(Instructions.SKIP)
        this.insert32(skipTo);
        return this;
    }

    /**
     * Return from a sub-routine (function)
     * @param toAddressBelow indicated wether we should return and re-call the last instruction or skip to the next instruction
     */
    return(toAddressBelow = true): IDGBuilder{
        if(toAddressBelow){this.insert8(Instructions.RET_TO_NEXT)}
        else{this.insert8(Instructions.RET)}
        return this;
    }

    /**
     * Same as skip instruction but includes a return at the end to better emulate the behavior of a function
     * @param name name of the function. used for calling later
     * @param instructionsToSkip the instructions that are in this function (NOTE: you need to manually construct them after this call)
     */
    insertFunction(name: string, instructionsToSkip: Instructions[]): IDGBuilder{
        instructionsToSkip.push(Instructions.RET); // now also including a return that we add..
        this.skipInstructions(name, instructionsToSkip);
        this.return(true);
        this.functions.push(name);
        return this;
    }

    /**
     * calls some function repeatedly on the given interval.
     * NOTE: the called function should probably have a RET (return) instruction or else it will never pop the stack.. use the helper method here to build a function with a return statement
     * @param timeInMs 
     * @param callFunction the flag name (function name) or a number representing an address to call
     */
    atInterval(timeInMs: number, callFunction: string | number):IDGBuilder{
        this._warnIfNotAFunction(callFunction);
        if(typeof callFunction === "string") callFunction = this.getFlag(callFunction);
        this.insert8(Instructions.INTERVAL);
        this.insert32(timeInMs);
        this.insert32(callFunction);
        return this;
    }

    incrementRegister(reg: RegisterKey): IDGBuilder{
        this.insert8(Instructions.INC_REG);
        this.insert32(this._regKeyToIndex(reg));
        return this;
    }
    decrementRegister(reg: RegisterKey){
        this.insert8(Instructions.DEC_REG);
        this.insert32(this._regKeyToIndex(reg));
        return this;
    }

    currentHeapSize(){
        return this.memoryRequirementInBytes + this.instructionIndex;
    }
    compile(){
        console.log("COMPILING:")
        console.log(`
        TOTAL MEM: ${this.currentHeapSize()} bytes
        INSTR MEM: ${this.instructionIndex} bytes
        IMAGE MEM (allocated separately): ${(this.imageData.width * this.imageData.height) * 4} bytes
        `)
        /*
        1. make header
        2. make and populate initial image allocation
        3. make memory space and populate it with instructions
        4. (OPTIONAL) transform into a 32bit representation
        5. compress use ->  https://deno.land/x/compress@v0.3.8    (gzip)
        6. save to file (preferably as binary not as text, use Deno.WriteFile();)
        */
    }
}