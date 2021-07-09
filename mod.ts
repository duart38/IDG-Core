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
    imageData: new Array(size*size).fill(combineRGB([0,0,0])),
    width: size, height: size
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
// TODO: ......
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


// builder.modifyPixelAt(30,30, [255,255,255]);
// builder.modifyPixelAt(30+1,30-1, [255,255,255]);
// builder.modifyPixelAt(30+2,30-2, [255,255,255]);
// builder.modifyPixelAt(30+3,30-3, [255,255,255]);
// builder.modifyPixelAt(30+4,30-4, [255,255,255]);
// builder.modifyPixelAt(30+5,30-5, [255,255,255]);
// builder.modifyPixelAt(30+6,30-6, [255,255,255]);
// builder.modifyPixelAt(30+7,30-7, [255,255,255]);
// builder.modifyPixelAt(30+8,30-8, [255,255,255]);
// builder.modifyPixelAt(30+9,30-9, [255,255,255]);
// builder.modifyPixelAt(30+10,30-10, [255,255,255]);


const liveColor = combineRGB([255,255,255]);
const deadColor = combineRGB([0,0,0]);

builder.modifyPixelAt(23, 20, liveColor);
builder.modifyPixelAt(25, 20, liveColor);
builder.modifyPixelAt(27, 20, liveColor);

builder.RENDER();

const afterInit = builder.setFlag("afterInit");
builder.seeds(liveColor, deadColor) // on, off
builder.RENDER()
builder.GOTO(afterInit);



const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    // console.log("render called")
    const png = encode(new Uint8Array(data), size, size);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
