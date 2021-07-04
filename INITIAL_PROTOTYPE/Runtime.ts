import { ActionID,clearInterval, allTrue, arithmetic, calculateAndStore, coordinatesToIndex, DEBUG, direction, forEachPixel, getNeighboringPixel, ifEquals, ifGreaterThan, ifInBounds, ifLessThan, ifNotNil, instruction, interval, modifyPixel, randomNumber, storeValue, storePixelColor } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";
import { clamp, coordinatesByIndex, indexByCoordinates } from "../utils/coordinates.ts";
import { combineRGB, spreadImage } from "../utils/color.ts";
import { printImage } from "https://x.nest.land/terminal_images@3.0.0/mod.ts";
/**
 * For the sake of demoing this thing i'll just write the changes to disk.. deno lacks a DOM.
 */
export default class IDGRuntime {
    private IDG: FileShape;
    private imageCopy: number[];
    private imageMapLength;
    constructor(data: FileShape){
        this.IDG = data;
        this.imageMapLength = (data.width*data.width) * 4;
        this.imageCopy = [...data.imageMap];
    }



    atInterval(x: interval){
        this.IDG.memory[x[3]] = setInterval(()=>{
            for(let i = 0; i < x[4].length; i++) this.execute(x[4][i]);
        }, x[1] == 1 ? this.IDG.memory[x[2]] :x[2]);
    }
    clearInterval(x: clearInterval) {
        //return [ActionID.clearInterval, key]
        window.clearInterval(this.IDG.memory[x[1]]);
    }

    modifyPixel(x: modifyPixel){
        //ActionID.modifyPixel, fromVar, index, values
        // return [ActionID.modifyPixel, fromVar, index, values];
        const idx = x[1] == 1 ? this.IDG.memory[x[2]] : x[2];
        this.imageCopy[idx] = combineRGB([x[3][0], x[3][1], x[3][2]]);
        //this.imageCopy[idx + 3] = x[3][3]; // a
    }
    storeValue(x: storeValue){
        this.IDG.memory[x[1] == 1 ? this.IDG.memory[x[2]] : x[2]] = x[3];
    }
    DEBUG(_: DEBUG){
        const [x,y] = coordinatesByIndex(this.IDG.memory[0], 20);
        console.log(`DEBUG#:${_[1]}`);
    }


    /**
     * Renders an example to file
     * @todo in your own implementation this should render on screen directly
     */
    render(){
        this.IDG.imageMap = [...this.imageCopy];
        console.log("\n\n\n#########");
        console.log(this.IDG.imageMap.toString());
        const data = new Uint8Array(spreadImage(this.IDG.imageMap, true));
        const png = encode(data, this.IDG.width, this.IDG.height);
        Deno.writeFile("image.png", png).catch((x)=>{
            console.log(x);
        })


        // const data = new Uint8Array(spreadImage(this.IDG.imageMap));
        // console.clear();
        // printImage({
        //     rawPixels: {
        //         data,
        //         width: this.IDG.width, height: this.IDG.height
        //     },
           
        //     // by default the size of the image is set to fit in the terminal,
        //     // but you can override it with the width property
        //     width: this.IDG.width
        // })
    }

    forEachPixel(x: forEachPixel) {
        this.IDG.memory[x[1]] = 0;
        for(let i=0; i < this.imageCopy.length;i += 4) { // i -> pixel index
            this.IDG.memory[x[1]] = i;
            for(let b=0; b < x[2].length;b++) this.execute(x[2][b]);
        }
    }

    ifNotNil(x: ifNotNil): boolean {
        if(this.IDG.memory[x[1]] && this.IDG.memory[x[1]] !== undefined && this.IDG.memory[x[1]] !== null){
            for(let b=0; b < x[2].length;b++) this.execute(x[2][b]);
            return true;
        }
        return false;
    }
    getNeighboringPixel(x: getNeighboringPixel) {
        //[ActionID.getNeighboringPixel, indexFromMemory, where, index, locationToStore];
        let res = 0;
        const currentIndex = x[1] == 1 ? this.IDG.memory[x[3]] : x[3];

        //TODO: clamping needs to happen also at x,y .. i.e. make sure x is not less than 0 and not greater than imageWidth

        switch(x[2]){
            case direction.left: {
                //res = currentIndex - 4, this.;
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x-1, y, this.IDG.width);
                break;
            }
            case direction.right: {
                // res = currentIndex + 4, this.;
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x+1, y, this.IDG.width);
                break;
            }
            case direction.topLeft: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x-1, y-1, this.IDG.width);
                break;
            }
            case direction.top: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x, y-1, this.IDG.width);
                break;
            }
            case direction.topRight: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x+1, y-1, this.IDG.width);
                break;
            }
            case direction.bottomRight: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x+1, y+1, this.IDG.width);
                break;
            }
            case direction.bottom: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x, y+1, this.IDG.width);
                break;
            }
            case direction.bottomLeft: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = indexByCoordinates(x-1, y+1, this.IDG.width);
                break;
            }
            default: console.log("Invalid directional instruction");
        }
        this.IDG.memory[x[4]] = res;
    }

    storePixelColor(x: storePixelColor){
        const index = x[1] == 1 ? this.IDG.memory[x[2]] : x[2];
        this.IDG.memory[x[3]] = this.IDG.imageMap[index];
    }
    ifEquals(x: ifEquals): boolean {
        //[this#, lhsIsVar, rhsIsVar, lhs, rhs, actions[], elseActions[]]
        const lhs = x[1] == 1 ? this.IDG.memory[x[3]]: x[3];
        const rhs = x[2] == 1 ? this.IDG.memory[x[4]]: x[4];
        if(lhs === rhs) {
            for(let b=0; b < x[5].length;b++) this.execute(x[5][b]);
            return true;
        }else {
            for(let b=0; b < x[6].length;b++) this.execute(x[6][b]);
            return false;
        }
    }
    calculateAndStore(x: calculateAndStore) {
        //return [ActionID.calculateAndStore, operation, lhsIsVar, rhsIsVar, lhs, rhs, out];
        const lhs = x[2] == 1 ? this.IDG.memory[x[4]]: x[4];
        const rhs = x[3] == 1 ? this.IDG.memory[x[5]]: x[5];
        let res = 0;
        switch(x[1]){
            case arithmetic.ADDITION: res = lhs + rhs; break;
            case arithmetic.SUBTRACTION: res = lhs - rhs; break;
            case arithmetic.MULTIPLICATION: res = lhs * rhs; break;
            case arithmetic.DIVISION: res = lhs / rhs; break;
            case arithmetic.BIT_AND: res = lhs & rhs; break;
            case arithmetic.BIT_OR: res = lhs | rhs; break;
            default: console.error("Arithmetic", x[1], "not implemented");
        }
        this.IDG.memory[x[6]] = res;
    }

    ifGreaterThan(x: ifGreaterThan): boolean{
        //return [ActionID.ifGreaterThan, lhsIsVar, rhsIsVar, lhs, rhs, actions];
        const lhs = x[1] == 1 ? this.IDG.memory[x[3]]: x[3];
        const rhs = x[2] == 1 ? this.IDG.memory[x[4]]: x[4];
        if(lhs > rhs) {
            for(let b=0; b < x[5].length;b++) this.execute(x[5][b]);
            return true;
        }
        return false;
    }

    allTrue(x: allTrue): boolean {
        // [ActionID.allTrue, checks, actionsIfSuccess];
        for(let b=0; b < x[1].length;b++) {
            let res = this.execute(x[1][b]);
            if(res == false || res == undefined) return false; // early exit
        }
        for(let b=0; b < x[2].length;b++) this.execute(x[2][b]); // no exit -> call rest
        return true;
    }
    ifLessThan(x: ifLessThan): boolean {
        //return [ActionID.ifGreaterThan, lhsIsVar, rhsIsVar, lhs, rhs, actions];
        const lhs = x[1] == 1 ? this.IDG.memory[x[3]]: x[3];
        const rhs = x[2] == 1 ? this.IDG.memory[x[4]]: x[4];
        if(lhs < rhs) {
            for(let b=0; b < x[5].length;b++) this.execute(x[5][b]);
            return true;
        }
        return false;
    }
    randomNumber(x: randomNumber){
        //[this#, lhsIsVar, rhsIsVar, min, max, out(memoryPointer)]
        const min = Math.ceil(x[1] == 1 ? this.IDG.memory[x[3]]: x[3]);
        const max = Math.floor(x[2] == 1 ? this.IDG.memory[x[4]]: x[4]);
        const res = Math.floor(Math.random() * (max - min + 1) + min);
        this.IDG.memory[x[5]] = res;
    }

    coordinatesToIndex(x:coordinatesToIndex){
        //[this#, lhsIsVar, rhsIsVar, x, y, out(memoryPointer)]
        const x_coord = x[1] == 1 ? this.IDG.memory[x[3]]: x[3];
        const y_coord = x[2] == 1 ? this.IDG.memory[x[4]]: x[4];

        this.IDG.memory[x[5]] = indexByCoordinates(x_coord, y_coord, this.IDG.width);
    }

    ifInBounds(x: ifInBounds): boolean {
        //return [ActionID.ifInBounds, memoryKey, actions];
        const mem = this.IDG.memory[x[1]];
        if(mem >= 0 && mem < this.IDG.imageMap.length){
            for(let b=0; b < x[2].length;b++) this.execute(x[2][b]);
            return true;
        }
        return false;
    }


    start(){
        //this.IDG.instructions.forEach(this.execute);
        for(let i = 0; i < this.IDG.instructions.length; i++) this.execute(this.IDG.instructions[i]);
    }


    execute(x: instruction): boolean | undefined{
        switch(x[0]){
            case ActionID.interval: this.atInterval(x); break;
            case ActionID.modifyPixel: this.modifyPixel(x); break;
            case ActionID.render: this.render(); break;
            case ActionID.storeValue: this.storeValue(x); break;
            case ActionID.forEachPixel: this.forEachPixel(x); break;
            case ActionID.ifNotNil: return this.ifNotNil(x);
            case ActionID.getNeighboringPixel: this.getNeighboringPixel(x); break;
            case ActionID.storePixelColor: this.storePixelColor(x); break;
            case ActionID.ifEquals: return this.ifEquals(x);
            case ActionID.calculateAndStore: this.calculateAndStore(x); break;
            case ActionID.ifGreaterThan: return this.ifGreaterThan(x);
            case ActionID.ifLessThan: return this.ifLessThan(x);
            case ActionID.allTrue: return this.allTrue(x);
            case ActionID.randomNumber: this.randomNumber(x); break;
            case ActionID.coordinatesToIndex: this.coordinatesToIndex(x); break;
            case ActionID.ifInBounds: return this.ifInBounds(x);
            case ActionID.clearInterval: this.clearInterval(x); break;
            case ActionID.DEBUG: this.DEBUG(x); break;
            default: console.log(x[0], "Not implemented");
        }
    }
}