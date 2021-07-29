import { assertEquals, assertNotEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { AccJumpType } from "../Instructions/jump.ts";
import { moveType } from "../Instructions/moving.ts";
import IDGLoader from "../Loader.ts";
import { Instructions } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
function makeBuilder(): Builder {
    let b = new Builder({width: 1, height: 1, imageData: [0]}, 100000);
    // skip over a modification and jump to it for testing
    b.skipInstructions("skipped", [Instructions.MOVE, Instructions.RET_TO_NEXT]);
    b.setFlag("call");
    b.insert8(Instructions.MOVE);
    b.insert8(moveType.MOV_LIT_REG);
    b.insert32(69);
    b.insert32(b._regKeyToIndex("r3"));
    b.insert8(Instructions.RET_TO_NEXT);

    return b;
}
async function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    // Some pre-population.
    loader.getVM().setRegister("r1", 0);
    loader.getVM().setRegister("r2", 2);
    loader.getVM().setRegister("r3", 3); // update this
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("Testing SKIP (jump depends on this)", async function () {
    const b = makeBuilder();
    assertNotEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});

Deno.test("JNE_LIT (true)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JNE_LIT);
    b.insert32(1); // lit
    b.insert32(b.getFlag("call")); // addr to jump to
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});

Deno.test("JNE_LIT (false)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JNE_LIT);
    b.insert32(0); // lit
    b.insert32(b.getFlag("call")); // addr to jump to
    assertNotEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});

Deno.test("JNE_REG (true)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JNE_REG);
    b.insert32(b._regKeyToIndex("r2")); // lit
    b.insert32(b.getFlag("call")); // addr to jump to
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});

Deno.test("JNE_REG (false)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JNE_REG);
    b.insert32(b._regKeyToIndex("r1")); // r1 is 0 so equals to acc
    b.insert32(b.getFlag("call")); // addr to jump to
    assertNotEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});


Deno.test("JEQ_REG (true)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JEQ_REG);
    b.insert32(b._regKeyToIndex("r1")); // lit
    b.insert32(b.getFlag("call")); // addr to jump to
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});

Deno.test("JEQ_REG (false)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.JMP_ACC);
    b.insert8(AccJumpType.JEQ_REG);
    b.insert32(b._regKeyToIndex("r2"));
    b.insert32(b.getFlag("call")); // addr to jump to
    assertNotEquals((await makeLoader(b,true)).getVM().getRegister("r3"), 69);
});