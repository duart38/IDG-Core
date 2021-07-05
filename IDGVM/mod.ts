import { Direction } from "../interfaces/Actions.ts";
import { chunkUp32 } from "../utils/bits.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions, RegisterKey } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory((256 * 256 * 256 * 256));
MM.map(memory, 0, 0x7FFFFFFF);


const writableBytes = new Uint8Array(memory.buffer);
let i = 0;
const cpu = new IDGVM(MM, {imageData: [1,9,5,3], width: 2, height: 2});

cpu.onImageRenderRequest((dat)=>{
    console.log("\n\n\n Render request!", dat);
})
// cpu.debug()
const PADDING = 0x00;
cpu.debug();

// "COL", // 14
// "x", // 15
// "y", // 16

writableBytes[i++] = Instructions.RGB_LIT_TO_COLOR
writableBytes.set(chunkUp32(255), i); i += 4;
writableBytes.set(chunkUp32(255), i); i += 4;
writableBytes.set(chunkUp32(255), i); i += 4;



// writableBytes[i++] = Instructions.HLT


cpu.viewMemoryAt(0x2BC, 16)


let stepCount = 0;
while(1){
    alert(`####### STEP ####### ${stepCount}`);
    cpu.step();
    cpu.debug();
    stepCount++;
}


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