import { ImageData } from "../../interfaces/Image.ts";

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
    constructor(imageData: ImageData){
        this.imageData = imageData;
        this.flags = {};
    }
    //TODO: all instructions here... along with some other ones that group some instructions\

    /**
     * Sets a flag at the current instruction index so that you can refer back to it in code later.
     * Very useful for jumping around as you don't need to remember the locations in memory.
     */
    setFlag(name: string){
        this.flags[name] = this.instructionIndex
    }

    compile(){
        // use : https://deno.land/x/compress@v0.3.8    (deflate)
    }
}