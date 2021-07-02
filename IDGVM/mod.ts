// const createMemory = require('./create-memory');
// const CPU = require('./cpu');
// const MemoryMapper = require('./memory-mapper.js'    );

import { CreateDumpToDiskDisplay } from "./Display.ts";
import CPU from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";
const IP = 0;
const ACC = 1;
const R1 = 2;
const R2 = 3;
const R3 = 4;
const R4 = 5;
const R5 = 6;
const R6 = 7;
const R7 = 8;
const R8 = 9;
const SP = 10;
const FP = 11;

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