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
    public instructions: Uint8Array;
    constructor(imageData: ImageData){
        this.imageData = imageData;
        this.flags = {};
        this.instructions = new Uint8Array()
    }
    //TODO: all instructions here... along with some other ones that group some instructions\

    /**
     * Sets a flag at the current instruction index so that you can refer back to it in code later.
     * Very useful for jumping around as you don't need to remember the locations in memory.
     */
    setFlag(name: string){
        if(this.flags[name]) console.warn(`Warning: renamed flag ${name}. you may ignore if intentional`);
        this.flags[name] = this.instructionIndex
    }
    getFlag(name: string){
        const r = this.flags[name];
        if(!r) throw new Error(`flag ${name} does not exist.`);
        return r;
    }

    /**
     * Calls a skipped instruction.
     * Skipped instructions are also known as functions as they are not evaluated unless called upon.
     * if the called instruction does not have an end (i.e. RET) then it will continue from there
     */
    callSkippedOrFunction(name: string){
        const r = this.flags[name];
        if(!r) throw new Error(`skipped instruction flag ${name} does not exist.`);
        this.callLocation(r);
    }

    /**
     * Calls the location provided. use labels to help yourself keep track of where to go.
     */
    callLocation(address: number){
        this.insert8(Instructions.CAL_LIT);
        this.insert32(address);
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

    StoreNumberToRegister(n: number, registerIndex: RegisterIndexOf){
        this.insert8(Instructions.MOV_LIT_REG);
        this.insert32(n);
        this.insert32(registerIndex);
    }

    /**
     * Skips the following instructions (size is calculated).
     * NOTE: this does not define the instructions themselves. the array is only used for calculating where to skip to.
     * @param name used to store a "flag" in a temporary helper table that can be used to call this skipped instruction later. @see {callFunction}
     */
    skipInstructions(name: string, instructionsToSkip: Instructions[]){
        this.setFlag(name);
        const skipTo = instructionsToSkip.reduce((prev, curr)=> prev + InstructionInformation[curr].size, 0);
        this.insert8(Instructions.SKIP)
        this.insert32(skipTo);
    }

    /**
     * Return from a sub-routine (function)
     */
    return(){
        this.insert8(Instructions.RET);
    }

    /**
     * Same as skip instruction but includes a return at the end to better emulate the behavior of a function
     * @param name name of the function. used for calling later
     * @param instructionsToSkip the instructions that are in this function (NOTE: you need to manually construct them after this call)
     */
    insertFunction(name: string, instructionsToSkip: Instructions[]){
        instructionsToSkip.push(Instructions.RET); // now also including a return that we add..
        this.skipInstructions(name, instructionsToSkip);
        this.return();
    }

    /**
     * calls some function repeatedly on the given interval.
     * NOTE: the called function should probably have a RET (return) instruction or else it will never pop the stack.. use the helper method here to build a function with a return statement
     * @param timeInMs 
     * @param callFunction the flag name (function name) or a number representing an address to call
     */
    atInterval(timeInMs: number, callFunction: string | number){
        if(typeof callFunction === "string") callFunction = this.getFlag(callFunction);
        this.insert8(Instructions.INTERVAL);
        this.insert32(timeInMs);
        this.insert32(callFunction);
    }

    compile(){
        // use : https://deno.land/x/compress@v0.3.8    (deflate)
    }
}