import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import { combineRGB } from "../../utils/color.ts";
import Builder from "../Builder/Builder.ts";
import { additionType, multiplicationType, subtractionType } from "../Instructions/arithemetic.ts";
import { RGBConversionType } from "../Instructions/color.ts";
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
    // Some pre-population.
    loader.getVM().setRegister("r1", 1);
    loader.getVM().setRegister("r2", 2);
    loader.getVM().setRegister("r3", 3);
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("RGB_TO_COLOR_LIT_LIT_LIT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.RGB_TO_COLOR);
    b.insert8(RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT);
    b.insert8(255);
    b.insert8(255);
    b.insert8(255);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("COL"), combineRGB([255, 255, 255]));
});