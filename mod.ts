import { decode, encode } from "https://deno.land/x/pngs/mod.ts";
import { FileShape } from "./interfaces/FileShape.ts";


const exampleFile: FileShape = JSON.parse(Deno.readTextFileSync("./example.json"));
console.log(exampleFile);
// [0,0,0,0] -> R,G,B,A (range: 0-255)
const data = new Uint8Array(exampleFile.imageMap);
// Encode the image to have width 2 and height 1 pixel
const png = encode(data, 2, 1);

await Deno.writeFile("image.png", png);