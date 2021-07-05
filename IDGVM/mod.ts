import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory((256 * 256 * 256 * 256));
MM.map(memory, 0, 0x7FFFFFFF);


const writableBytes = new Uint8Array(memory.buffer);
let i = 0;
const cpu = new IDGVM(MM);

// cpu.debug()
const PADDING = 0x00;
cpu.debug();

writableBytes[i++] = Instructions.SKIP
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 9

writableBytes[i++] = Instructions.MOV_LIT_REG
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 2
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 4

writableBytes[i++] = Instructions.MOV_LIT_REG
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 5
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = PADDING
writableBytes[i++] = 3

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