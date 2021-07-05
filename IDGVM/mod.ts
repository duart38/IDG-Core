import { chunkUp32 } from "../utils/bits.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions, RegisterKey } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory((256 * 256 * 256 * 256));
MM.map(memory, 0, 0x7FFFFFFF);


const writableBytes = new Uint8Array(memory.buffer);
let i = 0;
const cpu = new IDGVM(MM, {imageData: [0,0,0,0], width: 2, height: 2});

cpu.onImageRenderRequest((dat)=>{
    console.log("\n\n\n Render request!", dat);
})
// cpu.debug()
const PADDING = 0x00;
cpu.debug();

// "COL", // 14
// "x", // 15
// "y", // 16

writableBytes[i++] = Instructions.MOV_LIT_REG // x
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 0
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 15

writableBytes[i++] = Instructions.MOV_LIT_REG // y
writableBytes.set(chunkUp32(0), i); i += 4;
writableBytes.set(chunkUp32(16), i); i += 4;

writableBytes[i++] = Instructions.MOV_LIT_REG // COL -> 0x[FF][00][00]
writableBytes.set(chunkUp32(16711680), i); i += 4;
writableBytes.set(chunkUp32(14), i); i += 4;


writableBytes[i++] = Instructions.MODIFY_PIXEL
writableBytes[i++] = Instructions.RENDER

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