import { ActionID, bool, direction, forEachPixel, getNeighboringPixel, ifNotNil, instruction, interval, memoryPointer, modifyPixel, render, storeValue } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { RGBA } from "../interfaces/RGBA.ts";

export default class Builder {
    public IDG: FileShape;
    constructor(w: number, h: number){
        this.IDG = {width: w, height: h, imageMap: new Array((w*h) * 4).fill(0), instructions: [], memory: {}};
    }

    /**
     * Constructs an interval but does not append it to the active instructions
     * @param n interval timer in milliseconds
     * @param doAction instructions to execute when the timer hits 0
     * @param fromVar indicates wether the value of "n" is a pointer to a variable or just static
     */
    atInterval(n: number, fromVar: bool, doAction: instruction[]): interval {
        return [ActionID.interval, fromVar, n, doAction];
    }
    
    /**
     * modifies a pixel
     * @param index the index of the starting rgba range of a given pixel.
     * @param fromVar indicates wether the value of "n" is a pointer to a variable or just static
     * @param values the values to replace the range with
     */
    modifyPixel(index: number, fromVar: bool, values: RGBA): modifyPixel {
        return [ActionID.modifyPixel, fromVar, index, values];
    }

    /**
     * 
     * @param lhsIsVar indicates wether the value of "key" is to be fetched from an existing memory location
     * @param key 
     * @param value 
     */
    storeValue(lhsIsVar: bool, key: number, value: number): storeValue {
        return [ActionID.storeValue, lhsIsVar, key, value];
    }
    /**
     * Says it all dun it
     * @param indexStorageLocation where to store the current pixel index in memory (pixel index refers to the start of the R of an RGBA range in the image map)
     */
    forEachPixel(indexStorageLocation: number, actions: instruction[]): forEachPixel {
        return [ActionID.forEachPixel, indexStorageLocation, actions];
    }
    ifNotNil(memoryKey: number, actions: instruction[]): ifNotNil {
        return [ActionID.ifNotNil, memoryKey, actions];
    }
    getNeighboringPixel(indexFromMemory: bool, index: memoryPointer, where: direction, locationToStore: memoryPointer): getNeighboringPixel {
        // [ActionID.getNeighboringPixel, bool, direction, number, number]
        return [ActionID.getNeighboringPixel, indexFromMemory, where, index, locationToStore];
    }

    /**
     * Adds instructions to be compiled
     * @param x 
     */
    addInstructions(x: instruction[]){
        this.IDG.instructions.push(...x);
    }

    render(): render {
        return [ActionID.render];
    }

    compile(){
        return JSON.stringify(this.IDG);
    }

}