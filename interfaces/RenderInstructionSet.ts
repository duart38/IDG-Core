/**
 * Outward facing API for the rendering instructions.
 * To be used for example with the canvas API.
 * */
export enum RenderInstructionSet {
    MODIFY_PIXEL,
    /**
     * For performance reasons, we should use this instruction instead of modifying each pixel of the image
     * */
    FILL,
    // TODO: specific instruction for big shapes (rectangle, circle, also lines, etc). something like the canvas API can take advantage of this.
}