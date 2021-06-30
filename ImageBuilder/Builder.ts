import { ActionID, instruction, interval, modifyPixel, render } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { RGBA } from "../interfaces/RGBA.ts";

export default class Builder {
    public IDG: FileShape;
    constructor(w: number, h: number){
        this.IDG = {width: w, height: h, imageMap: new Array((w*h) * 4).fill(0), instructions: []};
    }

    /**
     * Constructs an interval but does not append it to the active instructions
     * @param n interval timer in milliseconds
     * @param doAction instructions to execute when the timer hits 0
     */
    atInterval(n: number, doAction: instruction[]): interval {
        return [ActionID.interval, n, doAction];
    }
    
    modifyPixel(index: number, values: RGBA): modifyPixel {
        return [ActionID.modifyPixel, index, values];
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