import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";
import { decode, encode } from "https://deno.land/x/pngs/mod.ts";
import { combineRGB } from "./utils/color.ts";
import { U255 } from "./interfaces/RGBA.ts";
import { Direction } from "./interfaces/Actions.ts";

const size = 30;
const builder = new IDGBuilder({
  imageData: new Array(size * size).fill(combineRGB([0, 0, 0])),
  width: size,
  height: size,
});


function randomB(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const liveColor = combineRGB([255, 255, 255]);
const deadColor = combineRGB([0, 0, 0]);

function test(_a: number, _b: number) {
  return Math.exp(_a) % Math.sin(_b) - Math.sqrt(_a) +
    Math.sqrt(_a) % Math.exp(_b) * Math.cos(_b) % Math.sqrt(_a) * Math.cos(_b);
}

// builder.RENDER();

// const afterInit = builder.setFlag("afterInit");
// builder.seeds(liveColor, deadColor) // on, off
// builder.RENDER()
// builder.GOTO(afterInit);

// builder.StoreNumberToRegister(1, "r1");
// builder.StoreNumberToRegister(1, "r2");

// builder.StoreNumberToRegister(5, "r3");
// builder.StoreNumberToRegister(5, "r4");

builder.StoreNumberToRegister(combineRGB([255, 255, 255]), "COL");

// builder.drawLineReg(["r1", "r2"], ["r3", "r4"]);
builder.drawLineLit([3, 5], [8, 5]);
builder.RENDER();

const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate(
  (data) => {
    console.log("render called")
    const png = encode(new Uint8Array(data), size, size);
    Deno.writeFile("image.png", png).catch((x) => {
      console.log("image encoding error: ", x);
    });
  },
  true,
  true,
);
loader.startVM();
