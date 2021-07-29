import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { ImageInfoFetchType } from "../Instructions/imageInformation.ts";
import IDGLoader from "../Loader.ts";
import { Instructions } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
function makeBuilder(): Builder {
    return new Builder({width: 1, height: 2, imageData: [69, 20]}, 100000);
}
async function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    // Some pre-population.
    // loader.getVM().setRegister("R", 255);
    // loader.getVM().setRegister("G", 255);
    // loader.getVM().setRegister("B", 255);
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("IMAGE_WIDTH_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_WIDTH_REG);
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 1);
});

Deno.test("IMAGE_WIDTH_MEM", async function () {
    const b = makeBuilder();
    const memStorage = b.instructionIndex + 40;
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_WIDTH_MEM);
    b.insert32(memStorage);
    assertEquals((await makeLoader(b,true)).getVM().getMemoryAt(memStorage), 1);
});

Deno.test("IMAGE_HEIGHT_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_HEIGHT_REG);
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 2);
});

Deno.test("IMAGE_HEIGHT_MEM", async function () {
    const b = makeBuilder();
    const memStorage = b.instructionIndex + 40;
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_HEIGHT_MEM);
    b.insert32(memStorage);
    assertEquals((await makeLoader(b,true)).getVM().getMemoryAt(memStorage), 2);
});

Deno.test("IMAGE_TOTAL_PIXELS_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_TOTAL_PIXELS_REG);
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 2);
});

Deno.test("IMAGE_TOTAL_PIXELS_MEM", async function () {
    const b = makeBuilder();
    const memStorage = b.instructionIndex + 40;
    b.insert8(Instructions.FETCH_IMAGE_INFO);
    b.insert8(ImageInfoFetchType.IMAGE_TOTAL_PIXELS_MEM);
    b.insert32(memStorage);
    assertEquals((await makeLoader(b,true)).getVM().getMemoryAt(memStorage), 2);
});