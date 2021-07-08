import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";

const builder = new IDGBuilder({
    imageData: new Array(30*30).fill(9),
    width: 30, height: 30
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

builder.drawCircle(5, 10,10, [255,255,255]);
builder.RENDER();


const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    console.log("render called")
    const png = encode(new Uint8Array(data), 30, 30);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
