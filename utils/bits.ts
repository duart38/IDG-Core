import { U255 } from "../interfaces/RGBA.ts";
import { gunzip, gzip } from "https://deno.land/x/compress@v0.3.8/mod.ts";

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

/**
 * Chunk up a 16-bit value into an array of 8 bit values
 * @param num 
 * @returns 
 */
 export function chunkUp16(num: number): [U255, U255]{
    const parts: [U255, U255] = [0,0];
    parts[0] = ((num & 0x0000FF00)>>8) as U255;
    parts[1] = ((num & 0x000000FF)) as U255;
    return parts;
}

export function compress(rawData: Uint8Array){
    return gzip(rawData);
}
export function deCompress(rawData: Uint8Array){
    return gunzip(rawData)
}

export class Uint8Constructor{
    public size: number;
    private index: number = 0;
    private _dat: Uint8Array;
    constructor(size: number){
        this.size = size;
        this._dat = new Uint8Array(size);
    }
    setNext(data: Uint8Array | ArrayLike<number>){
        this._dat.set(data, this.index);
        this.index += data.length;
    }
    getData(){
        return this._dat;
    }
}