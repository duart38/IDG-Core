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
    b.insert8(Instructions.MODIFY_PIXEL);
    b.insert8(PixelModificationType.MODIFY_PIXEL_REG_REG_REG);
    b.insert32(b._regKeyToIndex("x"));
    b.insert32(b._regKeyToIndex("y"));
    b.insert32(b._regKeyToIndex("COL"));
    assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], combineRGB([255,0,0]));
});

Deno.test("MODIFY_PIXEL_LIT_LIT_LIT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.MODIFY_PIXEL);
    b.insert8(PixelModificationType.MODIFY_PIXEL_LIT_LIT_LIT);
    b.insert32(0);
    b.insert32(0);
    b.insert32(69);
    assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], 69);
});

Deno.test("MODIFY_PIXEL_MEM_MEM_MEM", async function () {
    const b = makeBuilder();
    const x = b.instructionIndex + 45;
    b.MoveRegisterToMemory("x", x);

    const y = b.instructionIndex;
    b.MoveRegisterToMemory("y", y);

    const col = b.instructionIndex;
    b.MoveRegisterToMemory("COL", col);
    
    b.insert8(Instructions.MODIFY_PIXEL);
    b.insert8(PixelModificationType.MODIFY_PIXEL_MEM_MEM_MEM);
    b.insert32(x);
    b.insert32(y);
    b.insert32(col);
    assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], combineRGB([255,0,0]));
});

// TODO: luminosity tests