import { ActionID, direction, forEachPixel, getNeighboringPixel, ifNotNil, instruction, interval, modifyPixel, storeValue } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { RGBA } from "../interfaces/RGBA.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";
import { clamp, coordinatesByIndex, indexByCoordinates } from "../utils/coordinates.ts";

/**
 * For the sake of demoing this thing i'll just write the changes to disk.. deno lacks a DOM.
 */
export default class IDGRuntime {
    private IDG: FileShape;
    private imageMapLength;
    constructor(data: FileShape){
        this.IDG = data;
        this.imageMapLength = (data.width*data.width) * 4;
    }



    atInterval(x: interval){
        setInterval(()=>{
            for(let i = 0; i < x[3].length; i++) this.execute(x[3][i]);
        }, x[1] == 1 ? this.IDG.memory[x[2]] :x[2]);
    }
    modifyPixel(x: modifyPixel){
        //[ActionID.modifyPixel, number, number[]]
        this.IDG.imageMap[x[1]] = x[3][0]; // r
        this.IDG.imageMap[x[1] + 1] = x[3][1]; // g
        this.IDG.imageMap[x[1] + 2] = x[3][2]; // b
        this.IDG.imageMap[x[1] + 3] = x[3][3]; // a
    }
    storeValue(x: storeValue){
        this.IDG.memory[x[1] == 1 ? this.IDG.memory[x[2]] : x[2]] = x[3];
    }

    /**
     * Renders an example to file
     * @todo in your own implementation this should render on screen directly
     */
    render(){
        const data = new Uint8Array(this.IDG.imageMap);
        console.log(data);
        const png = encode(data, this.IDG.width, this.IDG.height);
        Deno.writeFile("image.png", png).then(()=>{
            console.log("Called render.. updating file")
        })
        .catch((x)=>{
            console.log(x);
        })
    }

    forEachPixel(x: forEachPixel) {
        for(let i=0; i < this.IDG.imageMap.length;i += 4) { // i -> pixel index
            this.IDG.memory[x[1]];
            for(let b=0; b < x[2].length;b++) this.execute(x[2][b]);
        }
    }

    ifNotNil(x: ifNotNil) {
        if(this.IDG.memory[x[1]] && this.IDG.memory[x[1]] !== undefined && this.IDG.memory[x[1]] !== null)
            for(let b=0; b < x[2].length;b++) this.execute(x[2][b]);
    }
    getNeighboringPixel(x: getNeighboringPixel) {
        //[ActionID.getNeighboringPixel, indexFromMemory, where, index, locationToStore];
        let res = 0;
        const currentIndex = x[1] == 1 ? this.IDG.memory[x[3]] : x[3];
        switch(x[2]){
            case direction.left: res = clamp(currentIndex - 4, this.imageMapLength); break;
            case direction.right: res = clamp(currentIndex + 4, this.imageMapLength); break;
            case direction.topLeft: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x-1, y-1, this.IDG.width), this.imageMapLength);
                break;
            }
            case direction.top: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x, y-1, this.IDG.width), this.imageMapLength);
                break;
            }
            case direction.topRight: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x+1, y-1, this.IDG.width), this.imageMapLength);
                break;
            }
            case direction.bottomRight: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x+1, y+1, this.IDG.width), this.imageMapLength);
                break;
            }
            case direction.bottom: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x, y+1, this.IDG.width), this.imageMapLength);
                break;
            }
            case direction.bottomLeft: {
                const [x,y] = coordinatesByIndex(currentIndex, this.IDG.width);
                res = clamp(indexByCoordinates(x-1, y+1, this.IDG.width), this.imageMapLength);
                break;
            }
            default: console.log("Invalid directional instruction");
        }
        this.IDG.memory[x[4]] = res;
    }

    start(){
        //this.IDG.instructions.forEach(this.execute);
        for(let i = 0; i < this.IDG.instructions.length; i++) this.execute(this.IDG.instructions[i]);
    }


    execute(x: instruction){
        switch(x[0]){
            case ActionID.interval: this.atInterval(x); break;
            case ActionID.modifyPixel: this.modifyPixel(x); break;
            case ActionID.render: this.render(); break;
            case ActionID.storeValue: this.storeValue(x); break;
            case ActionID.forEachPixel: this.forEachPixel(x); break;
            case ActionID.ifNotNil: this.ifNotNil(x); break;
            case ActionID.getNeighboringPixel: this.getNeighboringPixel(x); break;
            default: console.log(x[0], "Not implemented");
        }
    }
}