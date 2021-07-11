import IDGBuilder from "../../IDGVM/Builder/Builder.ts";
import IDGLoader from "../../IDGVM/Loader.ts";
import { encode } from "https://deno.land/x/pngs/mod.ts";
import { combineRGB } from "../../utils/color.ts";


const size = 500;
const builder = new IDGBuilder({
    imageData: new Array(size*size).fill(combineRGB([0,0,0])),
    width: size, height: size
});

function randomB(min:number, max:number){
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const liveColor = combineRGB([255,255,255]);
const deadColor = combineRGB([0,0,0]);

builder.modifyPixelAt(23, 20, liveColor);
builder.modifyPixelAt(25, 20, liveColor);
builder.modifyPixelAt(27, 20, liveColor);

builder.modifyPixelAt(23, 22, liveColor);
builder.modifyPixelAt(25, 22, liveColor);
builder.modifyPixelAt(27, 22, liveColor);

const middle = size / 2;
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);
builder.modifyPixelAt(randomB(middle - 5, middle + 5), randomB(middle - 10, middle + 10), liveColor);

builder.RENDER();

const afterInit = builder.setFlag("afterInit");
builder.seeds(liveColor, deadColor) // on, off
builder.RENDER()
builder.GOTO(afterInit);



const compiled = builder.compile();

Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    const png = encode(new Uint8Array(data), size, size);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
