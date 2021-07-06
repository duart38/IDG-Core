import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";

const builder = new IDGBuilder({
    imageData: [
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
    ],
    width: 10, height: 6
});



builder.drawRectangle(5,5,  0,0, [255,255,255]);
builder.RENDER();


const compiled = builder.compile();



// test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    const png = encode(new Uint8Array(data), 10, 6);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log(x);
    })
}, true, true);
loader.startVM();
