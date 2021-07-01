import { ActionID, allTrue, arithmetic, calculateAndStore, DEBUG, direction, forEachPixel, getNeighboringPixel, ifEquals, ifGreaterThan, ifLessThan, ifNotNil, instruction, interval, modifyPixel, storePixelOpacity, storeValue } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { RGBA } from "../interfaces/RGBA.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";
import { clamp, coordinatesByIndex, indexByCoordinates } from "../utils/coordinates.ts";

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
        setInterval(()=>{
            for(let i = 0; i < x[3].length; i++) this.execute(x[3][i]);
        }, x[1] == 1 ? this.IDG.memory[x[2]] :x[2]);
    }
    modifyPixel(x: modifyPixel){
        //ActionID.modifyPixel, fromVar, index, values
        // return [ActionID.modifyPixel, fromVar, index, values];
        const idx = x[1] == 1 ? this.IDG.memory[x[2]] : x[2];
        this.imageCopy[idx]     = x[3][0]; // r
        this.imageCopy[idx + 1] = x[3][1]; // g
        this.imageCopy[idx + 2] = x[3][2]; // b
        this.imageCopy[idx + 3] = x[3][3]; // a
    }
    storeValue(x: storeValue){
        this.IDG.memory[x[1] == 1 ? this.IDG.memory[x[2]] : x[2]] = x[3];
    }
    DEBUG(_: DEBUG){
        const [x,y] = coordinatesByIndex(this.IDG.memory[0], 20);
        console.log(`DEBUG#:${_[1]} coords(${x},${y}) has (${this.IDG.memory[17]}) neighbors. current cell opacity(${this.IDG.memory[18]})`);
    }

    /**
     * Renders an example to file
     * @todo in your own implementation this should render on screen directly
     */
    render(){
        console.log("Rendering triggered");
        this.IDG.imageMap = [...this.imageCopy];
        const data = new Uint8Array(this.IDG.imageMap);
        const png = encode(data, this.IDG.width, this.IDG.height);
        
        Deno.writeFile("image.png", png).catch((x)=>{
            console.log(x);
        })
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

    storePixelOpacity(x: storePixelOpacity){
        const index = x[1] == 1 ? this.IDG.memory[x[2]] : x[2];
        this.IDG.memory[x[3]] = this.IDG.imageMap[index + 3]; // r,g,b,a  -> we are at r(6) --> r(6), b(7), g(8), a(9)
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
            case ActionID.storePixelOpacity: this.storePixelOpacity(x); break;
            case ActionID.ifEquals: return this.ifEquals(x);
            case ActionID.calculateAndStore: this.calculateAndStore(x); break;
            case ActionID.ifGreaterThan: return this.ifGreaterThan(x);
            case ActionID.ifLessThan: return this.ifLessThan(x);
            case ActionID.allTrue: return this.allTrue(x);
            case ActionID.DEBUG: this.DEBUG(x); break;
            default: console.log(x[0], "Not implemented");
        }
    }
}