import { ActionID, instruction, interval, modifyPixel } from "../interfaces/Actions.ts";
import { FileShape } from "../interfaces/FileShape.ts";
import { RGBA } from "../interfaces/RGBA.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";

/**
 * For the sake of demoing this thing i'll just write the changes to disk.. deno lacks a DOM.
 */
export default class IDGRuntime {
    private IDG: FileShape;
    constructor(data: FileShape){
        this.IDG = data;
    }



    atInterval(x: interval){
        setInterval(()=>{
            for(let i = 0; i < x[2].length; i++) this.execute(x[2][i]);
        }, x[1]);
    }
    modifyPixel(x: modifyPixel){
        //[ActionID.modifyPixel, number, number[]]
        this.IDG.imageMap[x[1]] = x[2][0]; // r
        this.IDG.imageMap[x[1] + 1] = x[2][1]; // g
        this.IDG.imageMap[x[1] + 2] = x[2][2]; // b
        this.IDG.imageMap[x[1] + 3] = x[2][3]; // a
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

    start(){
        //this.IDG.instructions.forEach(this.execute);
        for(let i = 0; i < this.IDG.instructions.length; i++) this.execute(this.IDG.instructions[i]);
    }


    execute(x: instruction){
        switch(x[0]){
            case ActionID.interval: this.atInterval(x); break;
            case ActionID.modifyPixel: this.modifyPixel(x); break;
            case ActionID.render: this.render(); break;
            default: console.log(x[0], "Not implemented");
        }
    }
}