import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";
import { Instructions } from "./IDGVM/Registers.ts";
import { encode, decode } from "https://deno.land/x/pngs/mod.ts";
import { combineRGB } from "./utils/color.ts";
import { U255 } from "./interfaces/RGBA.ts";
import { Direction } from "./interfaces/Actions.ts";

// const loadedImage = decode(Deno.readFileSync("./test_image.png"));
// const x = loadedImage.image;
// let image: number[] = [];
// for(let i = 0; i < loadedImage.image.length; i += 4){
//     const r = x[i] as U255;
//     const g = x[i+1] as U255;
//     const b = x[i+2] as U255;
//     image.push(combineRGB([r,g,b]));
// }

const size = 50;
const builder = new IDGBuilder({
    imageData: new Array(size*size).fill(combineRGB([255,255,255])),
    width: size, height: size
});
// builder.memoryRequirementInBytes += 4 * 100;

// 1 -> right
// 2 -> bottom
// 3 -> left
// 4 -> top

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
// TODO: instead of method chaining always make the functions return their index after
// TODO: for all jumpIf statements make a separate method that we jump to if the thing is true.. this method proceeds to push the state and call the desired method?
//        draw the above.
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////


builder.StoreNumberToRegister(25, "x");
builder.StoreNumberToRegister(25, "y");
const afterInit = builder.setFlag("afterInit");


const setTo0 = builder.functionBuilder(); // circular for when moving clock wise
setTo0.markStart();
    builder.StoreNumberToRegister(1, "acc");
    builder.StoreNumberToRegister(1, "r1");
setTo0.markEnd();




const setTo4 = builder.functionBuilder(); // circular for when moving anti-clock wise
setTo4.markStart();
    builder.StoreNumberToRegister(4, "acc");
    builder.StoreNumberToRegister(4, "r1");
setTo4.markEnd();




const moveRight = builder.functionBuilder();
moveRight.markStart();
    // builder.shiftPixel(Direction.right);
    builder.incrementRegister("x");
moveRight.markEnd(); // error seems to happen when returning from a sub-routine it gives empty instructions

const moveBottom = builder.functionBuilder();
moveBottom.markStart();
    // builder.shiftPixel(Direction.bottom);
    builder.incrementRegister("y");
moveBottom.markEnd();

const moveLeft = builder.functionBuilder();
moveLeft.markStart();
    // builder.shiftPixel(Direction.left);
    builder.decrementRegister("x");
moveLeft.markEnd();

const moveTop = builder.functionBuilder();
moveTop.markStart();
    // builder.shiftPixel(Direction.top);
    builder.decrementRegister("y");
moveTop.markEnd();



const jumpSwitch = builder.functionBuilder(); // jumps to a move instruction based on the value in acc
jumpSwitch.markStart();
    builder.JumpIfEquals(moveRight, 1);
    builder.JumpIfEquals(moveBottom, 2);
    builder.JumpIfEquals(moveLeft, 3);
    builder.JumpIfEquals(moveTop, 4);
jumpSwitch.markEnd();



// At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
const turn90ClockWise = builder.functionBuilder(); // jump here if white.
turn90ClockWise.markStart();
    builder.incrementRegister("r1");
    builder.MoveRegisterValueToAnother("r1", "acc");
    builder.JumpIfLessThan(setTo0, 4); // clamping action 
    //builder.StoreNumberToRegister(combineRGB([0,0,0]), "COL"); // the shift instructions later require a value in COL to set the old value to
    builder.modifyPixel([0,0,0]); // modify the pixel at coords
    jumpSwitch.call(); // move to a different coordinate
turn90ClockWise.markEnd();


// At a black square, turn 90° counter-clockwise, flip the color of the square, move forward one unit
const turn90ANTIClockWise = builder.functionBuilder(); // jump here if white.
turn90ANTIClockWise.markStart();
    builder.debug(0);
    builder.decrementRegister("r1");
    builder.MoveRegisterValueToAnother("r1", "acc");
    builder.JumpIfGreaterThan(setTo4, 1); // clamping action
    //builder.StoreNumberToRegister(combineRGB([255,255,255]), "COL"); // the shift instructions later require a value in COL to set the old value to
    builder.modifyPixel([255,255,255]);
    jumpSwitch.call();
turn90ANTIClockWise.markEnd();






// 1. fetch the [pixel index] by register coordinates
// 2. fetch the color by the index we just captured above (step.1)
// 3. check if pixel is black or white

builder.fetchPixelIndexByRegisterCoordinates("r4");
builder.fetchPixelColor("r4"); // this puts the result in "COL" register
builder.MoveRegisterValueToAnother("COL", "acc"); // jumps below need acc value. so move.



// At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
builder.JumpIfEquals(turn90ClockWise, combineRGB([255,255,255]));

// TODO: we are never moving anti-clock-wise (below)
// At a black square, turn 90° counter-clockwise, flip the color of the square, move forward one unit
builder.JumpIfEquals(turn90ANTIClockWise, combineRGB([0,0,0]));


builder.RENDER();
// builder.SLEEP(500);
builder.GOTO(afterInit);




// const loop1 = builder.loopBuilder(Instructions.JGT_LIT, 5)
// loop1.markStart();
//     builder.incrementRegister("acc");
// loop1.markEnd()

//builder.drawCircle(30, 100,100, [255,255,255]);


const compiled = builder.compile();

// // Deno.writeFile("./example.idg", compiled);

// // test loading compiled code
const loader = new IDGLoader(compiled);
loader.onImageUpdate((data)=>{
    console.log("render called")
    const png = encode(new Uint8Array(data), size, size);
    Deno.writeFile("image.png", png).catch((x)=>{
        console.log("image encoding error: ", x);
    })
}, true, true);
loader.startVM();
