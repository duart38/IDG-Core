import { instruction } from "./Actions.ts";

/**
 * @deprecated
 */
export interface FileShape {
    width: number, height: number
    imageMap: number[],
    memory: Record<number, number>,
    instructions: instruction[]
}

/**
 * [imageWidth, imageHeight, MemoryAllocation]
 */
export type IDGHeader = [number, number, number];