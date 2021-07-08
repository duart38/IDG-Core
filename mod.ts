import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";

const builder = new IDGBuilder({
    imageData: new Array(4*4).fill(9),
    width: 4, height: 4
});

// const testFunction = builder.functionBuilder();
// testFunction.markStart()
//     builder.RGBToColor([255,255,255])
// testFunction.markEnd();
// testFunction.call(); // to call the function directly



const loop1 = builder.loopBuilder(Instructions.JGT_LIT, 5)
loop1.markStart();
    builder.incrementRegister("acc");
loop1.markEnd()


const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
// loader.onImageUpdate((data)=>{
//     console.log("render called")
//     // const png = encode(new Uint8Array(data), 10, 6);
//     // Deno.writeFile("image.png", png).catch((x)=>{
//     //     console.log(x);
//     // })
// }, true, true);
loader.startVM();
