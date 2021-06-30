import { decode, encode } from "https://deno.land/x/pngs/mod.ts";
import Builder from "./ImageBuilder/Builder.ts";
import IDGRuntime from "./ImageBuilder/Runtime.ts";
import { ActionID } from "./interfaces/Actions.ts";
import { FileShape } from "./interfaces/FileShape.ts";


// const exampleFile: FileShape = {
//     width: 4, height: 4,
//     "imageMap": [255, 0, 0, 255, 0, 0, 0, 255],
//     "instructions": [
//         [ActionID.interval, 5000, [
//             [ActionID.modifyPixel, 0, [0, 255, 0, 255]]
//         ]]
//     ]
// }

const CelBuilder = new Builder(2,2);
CelBuilder.addInstructions([
    CelBuilder.modifyPixel(0, [0,0,0,1]),
    CelBuilder.render(),
    CelBuilder.atInterval(3000, [
        CelBuilder.modifyPixel(0, [255,255,255,255]),
        CelBuilder.render()
    ])
]);

const x = new IDGRuntime(CelBuilder.IDG);
x.start();


// const data = new Uint8Array(exampleFile.imageMap);
// const png = encode(data, 2, 1);

// await Deno.writeFile("image.png", png);


