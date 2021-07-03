import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";

const MM = new MemoryMapper();

const memory = createMemory(256*256);
MM.map(memory, 0, 0xffff);

// Map 0xFF bytes of the address space to an "output device"
//MM.map(CreateDumpToDiskDisplay() as unknown as any, 0x3000, 0x30ff, true); // TODO: figure out first param

const writableBytes = new Uint8Array(memory.buffer);
let i = 0;
const cpu = new IDGVM(MM);


writableBytes[i++] = Instructions.MOV_LIT_REG
writableBytes[i++] = 0x00
writableBytes[i++] = 0x05
writableBytes[i++] = 0x02

writableBytes[i++] = Instructions.ADD_REG_REG
writableBytes[i++] = 0x02
writableBytes[i++] = 0x02

cpu.debug()
cpu.step()
cpu.debug()
cpu.step()
cpu.debug()



// cpu.run();