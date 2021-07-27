import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { shiftType } from "../Instructions/bitwise.ts";
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

Deno.test("LSF_REG_LIT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.BITWISE_SHIFT);
    b.insert8(shiftType.LSF_REG_LIT);
    b.insert32(b._regKeyToIndex("r2"));
    b.insert32(1);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r2"), 4);
});

Deno.test("LSF_REG_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.BITWISE_SHIFT);
    b.insert8(shiftType.LSF_REG_REG);
    b.insert32(b._regKeyToIndex("r2"));
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r2"), 4);
});

Deno.test("LSF_REG_MEM", async function () {
    const b = makeBuilder();
    const storeAt = b.instructionIndex + 30;
    b.MoveRegisterToMemory("r1", storeAt);
    b.insert8(Instructions.BITWISE_SHIFT);
    b.insert8(shiftType.LSF_REG_MEM);
    b.insert32(b._regKeyToIndex("r2"));
    b.insert32(storeAt);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r2"), 4);
});