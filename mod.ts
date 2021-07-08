import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";
import { encode, decode } from "https://deno.land/x/pngs/mod.ts";
import { combineRGB } from "./utils/color.ts";
import { U255 } from "./interfaces/RGBA.ts";

const loadedImage = decode(Deno.readFileSync("./test_image.png"));
const x = loadedImage.image;
let image: number[] = [];
for(let i = 0; i < loadedImage.image.length; i += 4){
    const r = x[i] as U255;
    const g = x[i+1] as U255;
    const b = x[i+2] as U255;
    image.push(combineRGB([r,g,b]));
}

const builder = new IDGBuilder({
    imageData: image,
    width: loadedImage.width, height: loadedImage.height
});

// const testFunction = builder.functionBuilder();
// testFunction.markStart()
//     builder.RGBToColor([255,255,255])
// testFunction.markEnd();
// testFunction.call(); // to call the function directly



// const loop1 = builder.loopBuilder(Instructions.JGT_LIT, 5)
// loop1.markStart();
//     builder.incrementRegister("acc");
// loop1.markEnd()

builder.drawCircle(30, 100,100, [255,255,255]);
builder.RENDER();


const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    console.log("render called")
    const png = encode(new Uint8Array(data), loadedImage.width, loadedImage.height);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
