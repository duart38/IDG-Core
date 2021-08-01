import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import { combineRGB } from "../../utils/color.ts";
import Builder from "../Builder/Builder.ts";
import { PixelModificationType } from "../Instructions/pixelModification.ts";
import IDGLoader from "../Loader.ts";
import { Instructions } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
 function makeBuilder(): Builder {
    return new Builder({width: 1, height: 1, imageData: [0]}, 100000);
}
async function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    loader.getVM().setRegister("COL", combineRGB([255,0,0]));
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("MODIFY_PIXEL_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.MODIFY_PIXEL_REG);
    assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], combineRGB([255,0,0]));
});

Deno.test("MODIFY_PIXEL_REG_REG_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.MODIFY_PIXEL_REG);
    b.insert8(PixelModificationType.MODIFY_PIXEL_REG_REG_REG);
    b.insert32(b._regKeyToIndex("x"));
    b.insert32(b._regKeyToIndex("y"));
    b.insert32(b._regKeyToIndex("COL"));
    assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], combineRGB([255,0,0]));
});

// Deno.test("MOV_LIT_REG", async function () {
//     const b = makeBuilder();
//     b.insert8(Instructions.MOVE);
//     b.insert8(moveType.MOV_LIT_REG);
//     b.insert32(50);
//     b.insert32(b._regKeyToIndex("r1"));
//     assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 50);
// });

// Deno.test("MOV_REG_MEM", async function () {
//     const b = makeBuilder();
//     const storeAt = b.instructionIndex + 30;
//     b.insert8(Instructions.MOVE);
//     b.insert8(moveType.MOV_REG_MEM);
//     b.insert32(b._regKeyToIndex("r3"));
//     b.insert32(storeAt);
//     assertEquals((await makeLoader(b,true)).getVM().getMemoryAt(storeAt), 50);
// });