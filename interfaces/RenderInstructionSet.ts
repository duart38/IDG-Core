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
}