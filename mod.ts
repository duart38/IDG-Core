import { coordinatesByIndex, indexByCoordinates } from "./utils/coordinates.ts";
import { combineRGB } from "./utils/color.ts";
import { createMemory } from "./IDGVM/Memory.ts";


console.log(combineRGB([255,255,255])); // 16777215

console.log(combineRGB([255,0,0])); // 16711680 (RED)



// let result = chunkUp(16711680);
// console.log("parts", result);

// let mem = createMemory(4);
// let wriatble = new Uint8Array(mem.buffer);
// wriatble[0] = result[0];
// wriatble[1] = result[1];
// wriatble[2] = result[2];
// wriatble[3] = result[3];

// console.log(mem.getUint32(0));


