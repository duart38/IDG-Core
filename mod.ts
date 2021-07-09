import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";
import { encode, decode } from "https://deno.land/x/pngs/mod.ts";
import { combineRGB } from "./utils/color.ts";
import { U255 } from "./interfaces/RGBA.ts";
import { Direction } from "./interfaces/Actions.ts";

// const loadedImage = decode(Deno.readFileSync("./test_image.png"));
// const x = loadedImage.image;
// let image: number[] = [];
// for(let i = 0; i < loadedImage.image.length; i += 4){
//     const r = x[i] as U255;
//     const g = x[i+1] as U255;
//     const b = x[i+2] as U255;
//     image.push(combineRGB([r,g,b]));
// }

const size = 50;
const builder = new IDGBuilder({
    imageData: new Array(size*size).fill(combineRGB([255,255,255])),
    width: size, height: size
});
// builder.memoryRequirementInBytes += 4 * 100;

// 1 -> right
// 2 -> bottom
// 3 -> left
// 4 -> top

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
// TODO: instead of method chaining always make the functions return their index after
// TODO: for all jumpIf statements make a separate method that we jump to if the thing is true.. this method proceeds to push the state and call the desired method?
//        draw the above.
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


builder.StoreNumberToRegister(25, "x");
builder.StoreNumberToRegister(25, "y");
const afterInit = builder.setFlag("afterInit");

builder.langtonsAnt(combineRGB([255,255,255]), combineRGB([0,0,0]))
builder.RENDER()

builder.GOTO(afterInit);



const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    console.log("render called")
    const png = encode(new Uint8Array(data), size, size);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
