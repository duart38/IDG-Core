import { Direction } from "../interfaces/Actions.ts";
import { chunkUp32 } from "../utils/bits.ts";
import IDGBuilder from "./Builder/Builder.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions, RegisterIndexOf, RegisterKey } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory((256 * 256 * 256 * 256));
MM.map(memory, 0, 0x7FFFFFFF);


const writableBytes = new Uint8Array(memory.buffer);
let i = 0;

const fakeWidth = 20;
const fakeHeight = 20;
const fakeImage = new Array(fakeWidth * fakeHeight).fill(0);



// const builder = new IDGBuilder({imageData: fakeImage, width: fakeWidth, height: fakeHeight});
// builder.insertFunction("inrecement", [Instructions.INC_REG]); // TODO: return not being called
// builder.incrementRegister(RegisterIndexOf.r1);
// builder.atInterval(2000, "inrecement");
// // some random stuff
// builder.StoreNumberToRegister(99, RegisterIndexOf.r4);
// builder.StoreNumberToRegister(99, RegisterIndexOf.r3);
// builder.StoreNumberToRegister(99, RegisterIndexOf.r2);

// writableBytes.set(builder.instructions);


const cpu = new IDGVM(MM, {imageData: fakeImage, width: fakeWidth, height: fakeHeight});

cpu.onImageRenderRequest((dat)=>{
    console.log("\n\n\n Render request!", dat.toString());
})


cpu.run();

// cpu.debug();
// cpu.viewMemoryAt(0x2BC, 16)

// let stepCount = 0;
// while(1){
//     alert(`####### STEP ####### ${stepCount}`);
//     cpu.step();
//     cpu.debug();
//     stepCount++;
// }


// writableBytes[i++] = Instructions.ADD_REG_REG
// writableBytes[i++] = PADDING
// writableBytes[i++] = PADDING
// writableBytes[i++] = PADDING
// writableBytes[i++] = 0x02
// writableBytes[i++] = PADDING
// writableBytes[i++] = PADDING
// writableBytes[i++] = PADDING
// writableBytes[i++] = 0x02
// cpu.step()
// cpu.debug()

cpu.viewMemoryAt(27, 16);


// cpu.run();