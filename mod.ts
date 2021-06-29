import { decode, encode } from "https://deno.land/x/pngs/mod.ts";
import { ActionID } from "./interfaces/Actions.ts";
import { FileShape } from "./interfaces/FileShape.ts";


//const exampleFile: FileShape = JSON.parse(Deno.readTextFileSync("./example.json"));
const exampleFile: FileShape = {
    "imageMap": [255, 0, 0, 255, 0, 0, 0, 255],
    "instructions": [
        [ActionID.interval, 5000, [
            [ActionID.modifyPixel, 0, [0, 255, 0, 255]]
        ]]
    ]
}
console.log(JSON.stringify(exampleFile));
// [0,0,0,0] -> R,G,B,A (range: 0-255)
const data = new Uint8Array(exampleFile.imageMap);
// Encode the image to have width 2 and height 1 pixel
const png = encode(data, 2, 1);

await Deno.writeFile("image.png", png);