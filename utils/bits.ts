/**
 * Chunk up a 32-bit value into an array of 8 bit values
 * @param num 
 * @returns 
 */
export function chunkUp32(num: number){
    let parts: number[] = new Array(4).fill(0);
    parts[0] = (num & 0x7F000000)>>32;
    parts[1] = (num & 0x00FF0000)>>16;
    parts[2] = (num & 0x0000FF00)>>8;
    parts[3] = (num & 0x000000FF);
    return parts;
}