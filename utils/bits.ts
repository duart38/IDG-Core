import { U255 } from "../interfaces/RGBA.ts";

/**
 * Chunk up a 32-bit value into an array of 8 bit values
 * @param num 
 * @returns 
 */
export function chunkUp32(num: number): [U255, U255, U255, U255]{
    const parts: [U255, U255, U255, U255] = [0,0,0,0];
    parts[0] = ((num & 0x7F000000)>>32) as U255;
    parts[1] = ((num & 0x00FF0000)>>16) as U255;
    parts[2] = ((num & 0x0000FF00)>>8) as U255;
    parts[3] = ((num & 0x000000FF)) as U255;
    return parts;
}