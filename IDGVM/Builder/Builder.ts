import { ImageData } from "../../interfaces/Image.ts";

/**
 * The Builder here takes care of easily constructing certain instructions.
 * It also keeps track of the memory requirements based on what requests are made.
 */
export default class IDGBuilder {
    private instructionIndex = 0;
    private memoryRequirement = 0;
    private imageData: ImageData;
    constructor(imageData: ImageData){
        this.imageData = imageData;
    }
}