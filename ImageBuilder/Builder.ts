import { ActionID, allTrue, arithmetic, bool, calculateAndStore, comparison, coordinatesToIndex, DEBUG, direction, forEachPixel, getNeighboringPixel, ifEquals, ifGreaterThan, ifInBounds, ifLessThan, ifNotNil, instruction, interval, memoryPointer, modifyPixel, randomNumber, render, storePixelOpacity, storeValue, clearInterval } from "../interfaces/Actions.ts";
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
     * @param timerStorageKey indicates where in memory to store the interval handler
     */
    atInterval(n: number, fromVar: bool, timerStorageKey: number, doAction: instruction[]): interval {
        return [ActionID.interval, fromVar, n, timerStorageKey, doAction];
    }
    clearInterval(key: number): clearInterval {
        return [ActionID.clearInterval, key]
    }
    
    /**
     * modifies a pixel
     * @param index the index of the starting rgba range of a given pixel.
     * @param fromVar indicates wether the value of "n" is a pointer to a variable or just static
     * @param values the values to replace the range with
     */
    modifyPixel(indexFromVar: bool, index: number, values: RGBA): modifyPixel {
        return [ActionID.modifyPixel, indexFromVar, index, values];
    }
    allTrue(checks: comparison[], actionsIfSuccess: instruction[]): allTrue {
        return [ActionID.allTrue, checks, actionsIfSuccess];
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
    storePixelOpacity(indexFromMemory: bool, pixelIndex: number, memoryKey: memoryPointer): storePixelOpacity {
        return [ActionID.storePixelOpacity, indexFromMemory, pixelIndex, memoryKey];
    }
    ifEquals(lhsIsVar: bool, rhsIsVar: bool, lhs: number, rhs: number, actions: instruction[], elseActions: instruction[] = []): ifEquals{
        return [ActionID.ifEquals, lhsIsVar, rhsIsVar, lhs, rhs, actions, elseActions];
    }
    calculateAndStore(operation: arithmetic, lhsIsVar: bool, rhsIsVar: bool, lhs: number, rhs: number, out: memoryPointer): calculateAndStore {
        return [ActionID.calculateAndStore, operation, lhsIsVar, rhsIsVar, lhs, rhs, out];
    }
    ifGreaterThan(lhsIsVar: bool, rhsIsVar: bool, lhs: number, rhs: number, actions: instruction[]): ifGreaterThan{
       return [ActionID.ifGreaterThan, lhsIsVar, rhsIsVar, lhs, rhs, actions];
    }
    ifLessThan(lhsIsVar: bool, rhsIsVar: bool, lhs: number, rhs: number, actions: instruction[]): ifLessThan{
        return [ActionID.ifLessThan, lhsIsVar, rhsIsVar, lhs, rhs, actions];
     }
     DEBUG(id: number): DEBUG {
        return [ActionID.DEBUG, id];
     }

     randomNumber(lhsIsVar: bool, rhsIsVar: bool, min: number, max: number, out: memoryPointer): randomNumber {
        return [ActionID.randomNumber, lhsIsVar, rhsIsVar, min, max, out];
     }
     coordinatesToIndex(lhsIsVar: bool, rhsIsVar: bool, x: number, y: number, out: memoryPointer): coordinatesToIndex{
        //[this#, lhsIsVar, rhsIsVar, x, y, out(memoryPointer)]
        return [ActionID.coordinatesToIndex, lhsIsVar, rhsIsVar, x, y, out];
     }
     ifInBounds(memoryKey: number, actions: instruction[]): ifInBounds{
        return [ActionID.ifInBounds, memoryKey, actions];
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