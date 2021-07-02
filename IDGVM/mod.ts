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

writableBytes[i++] = Instructions.ADD_LIT_REG
writableBytes[i++] = R1
writableBytes[i++] = 2


cpu.debug();



cpu.run();