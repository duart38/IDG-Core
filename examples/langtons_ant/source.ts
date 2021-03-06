import IDGBuilder from "../../IDGVM/Builder/Builder.ts";
import { combineRGB } from "../../utils/color.ts";

const sizeW = 274;
const sizeH = 200;
const builder = new IDGBuilder({
    imageData: new Array(sizeW*sizeH).fill(combineRGB([255,255,255])),
    width: sizeW, height: sizeH
});


/*
    // This can also be achieved with an instruction internally (faster)
    // The code below shows how.

    builder.StoreNumberToRegister(25, "x");
    builder.StoreNumberToRegister(25, "y");
    const afterInit = builder.setFlag("afterInit");

    builder.langtonsAnt(combineRGB([255,255,255]), combineRGB([0,0,0]))
    builder.RENDER()

    builder.GOTO(afterInit);

 */



// 1 -> right
// 2 -> bottom
// 3 -> left
// 4 -> top
builder.getRandomValue(10, sizeW);
builder.MoveRegisterValueToAnother("acc", "x");

builder.getRandomValue(10, sizeH);
builder.MoveRegisterValueToAnother("acc", "y");

builder.RENDER();
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
    builder.incrementRegister("x");
moveRight.markEnd();

const moveBottom = builder.functionBuilder();
moveBottom.markStart();
    builder.incrementRegister("y");
moveBottom.markEnd();

const moveLeft = builder.functionBuilder();
moveLeft.markStart();
    builder.decrementRegister("x");
moveLeft.markEnd();

const moveTop = builder.functionBuilder();
moveTop.markStart();
    builder.decrementRegister("y");
moveTop.markEnd();


const jumpSwitch = builder.functionBuilder(); // jumps to a move instruction based on the value in acc
jumpSwitch.markStart();
    builder.JumpIfEquals(moveRight, 1);
    builder.JumpIfEquals(moveBottom, 2);
    builder.JumpIfEquals(moveLeft, 3);
    builder.JumpIfEquals(moveTop, 4);
jumpSwitch.markEnd();


// At a white square, turn 90?? clockwise, flip the color of the square, move forward one unit
const turn90ClockWise = builder.functionBuilder(); // jump here if white.
turn90ClockWise.markStart();
    builder.incrementRegister("r1");
    builder.MoveRegisterValueToAnother("r1", "acc");
    builder.JumpIfLessThan(setTo0, 4); // clamping action 
    builder.modifyPixel([0,0,0]); // modify the pixel at coords
    jumpSwitch.call(); // move to a different coordinate
turn90ClockWise.markEnd();


// At a black square, turn 90?? counter-clockwise, flip the color of the square, move forward one unit
const turn90ANTIClockWise = builder.functionBuilder(); // jump here if white.
turn90ANTIClockWise.markStart();
    builder.decrementRegister("r1");
    builder.MoveRegisterValueToAnother("r1", "acc");
    builder.JumpIfGreaterThan(setTo4, 1); // clamping action
    builder.modifyPixel([255,255,255]);
    jumpSwitch.call();
turn90ANTIClockWise.markEnd();



builder.fetchPixelIndexByRegisterCoordinates("r4");
builder.fetchPixelColor("r4", "COL"); // this puts the result in "COL" register
builder.MoveRegisterValueToAnother("COL", "acc"); // jumps below need acc value. so move.


// At a white square, turn 90?? clockwise, flip the color of the square, move forward one unit
builder.JumpIfEquals(turn90ClockWise, combineRGB([255,255,255]));

// At a black square, turn 90?? counter-clockwise, flip the color of the square, move forward one unit
builder.JumpIfEquals(turn90ANTIClockWise, combineRGB([0,0,0]));


builder.RENDER();
builder.GOTO(afterInit);


const compiled = builder.compile();

Deno.writeFile("./langtons_ant.idg", compiled);

// test loading compiled code
// const loader = new IDGLoader(compiled);
// loader.onImageUpdate(
//   (data) => {
//     console.log(data)
//   }
// );
// loader.startVM();

