import CPU from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory(256*256);
MM.map(memory, 0, 0xffff);

// Map 0xFF bytes of the address space to an "output device" - just stdout
//MM.map(CreateDumpToDiskDisplay() as unknown as any, 0x3000, 0x30ff, true); // TODO: figure out first param

const writableBytes = new Uint8Array(memory.buffer);
let i = 0;
const cpu = new CPU(MM);


writableBytes[i++] = Instructions.MOV_LIT_REG
writableBytes[i++] = 0x12
writableBytes[i++] = 0x34
writableBytes[i++] = 0x02
// writableBytes[i++] = 0x01


cpu.debug()
cpu.step()
cpu.debug()



// cpu.run();