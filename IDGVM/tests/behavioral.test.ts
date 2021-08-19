import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { moveType } from "../Instructions/moving.ts";
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
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("Pause and continue test", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.HLT);

    b.insert8(Instructions.MOVE);
    b.insert8(moveType.MOV_LIT_REG);
    b.insert32(69);
    b.insert32(b._regKeyToIndex("r1"));


    const loader = await makeLoader(b,true);
    await loader.startVM();
    assertEquals(loader.getVM().getRegister("r1"), 69);
});

Deno.test("External Pause and continue test", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.MOVE);
    b.insert8(moveType.MOV_LIT_REG);
    b.insert32(2);
    b.insert32(b._regKeyToIndex("r1"));

    b.insert8(Instructions.MOVE);
    b.insert8(moveType.MOV_LIT_REG);
    b.insert32(69);
    b.insert32(b._regKeyToIndex("r1"));


    const loader = await makeLoader(b,false); // start 1.. till halt.
    loader.startVM(); // start again after halt.
    await loader.stopVM(); // start again after halt.
    await loader.startVM();
    assertEquals(loader.getVM().getRegister("r1"), 69);
});