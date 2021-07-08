import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";

const builder = new IDGBuilder({
    imageData: new Array(4*4).fill(9),
    width: 4, height: 4
});

// builder.insertFunction("test", [Instructions.MODIFY_PIXEL, Instructions.RENDER])
//     .modifyPixel()
//     .RENDER()
//     .return(false)



// builder.push("ip");
// builder.callSkippedOrFunction("test");
// const x = builder.StoreValueInMemory(6)
// builder.MoveMemoryToRegister(x, "r2")

const testFunction = builder.functionBuilder();
testFunction.markStart()

builder.RGBToColor([255,255,255])

testFunction.markEnd();
//testFunction.call(); // to call the function directly


builder.modifyPixel();
builder.StoreNumberToRegister(2, "r1");


// TODO: this seems to make the INTERVAL instruction work. make it into an instruction and put it at the final position of ram
// builder.setFlag("end");
// builder.GOTO("end");


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
