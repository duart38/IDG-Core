import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { additionType, subtractionType } from "../Instructions/arithemetic.ts";
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
Deno.test("ADD_REG_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_REG_REG);
    b.insert32(b._regKeyToIndex("r1"));
    b.insert32(b._regKeyToIndex("r2"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 3);
});

Deno.test("ADD_LIT_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_LIT_REG);
    b.insert32(5);
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 6);
});

Deno.test("ADD_REG_LIT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_REG_LIT);
    b.insert32(b._regKeyToIndex("r1"));
    b.insert32(5);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 6);
});

Deno.test("ADD_LIT_MEM", async function () {
    const b = makeBuilder();
    const storeAt = b.instructionIndex + 30;
    b.MoveRegisterToMemory("r1", storeAt);
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_LIT_MEM);
    b.insert32(5);
    b.insert32(storeAt);
    const vm = (await makeLoader(b, true)).getVM();
    assertEquals(vm.getRegister("acc"), 6);
});

Deno.test("ADD_REG_MEM", async function () {
    const b = makeBuilder();
    const storeAt = b.instructionIndex + 30;
    b.MoveRegisterToMemory("r2", storeAt);
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_REG_MEM);
    b.insert32(b._regKeyToIndex("r3"));
    b.insert32(storeAt);
    const vm = (await makeLoader(b, true)).getVM();
    assertEquals(vm.getRegister("acc"), 5);
});

Deno.test("SUB_REG_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.SUBTRACT);
    b.insert8(subtractionType.SUB_REG_REG);
    b.insert32(b._regKeyToIndex("r3"));
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 2);
});

Deno.test("SUB_LIT_REG", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.SUBTRACT);
    b.insert8(subtractionType.SUB_LIT_REG);
    b.insert32(3);
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 2);
});

Deno.test("SUB_REG_LIT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.SUBTRACT);
    b.insert8(subtractionType.SUB_REG_LIT);
    b.insert32(b._regKeyToIndex("r3"));
    b.insert32(1);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 2);
});

Deno.test("SUB_LIT_MEM", async function () {
    const b = makeBuilder();
    const storeAt = b.instructionIndex + 30;
    b.MoveRegisterToMemory("r1", storeAt);
    b.insert8(Instructions.SUBTRACT);
    b.insert8(subtractionType.SUB_LIT_MEM);
    b.insert32(3);
    b.insert32(storeAt);
    assertEquals((await makeLoader(b,true)).getVM().getRegister("acc"), 2);
});