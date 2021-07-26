import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import { additionType } from "../Instructions/arithemetic.ts";
import IDGLoader from "../Loader.ts";
import { Instructions } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
function makeBuilder(): Builder {
    return new Builder({width: 1, height: 1, imageData: [0]}, 100000);
}
function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    // Some pre-population.
    loader.getVM().setRegister("r1", 1);
    loader.getVM().setRegister("r2", 2);
    loader.getVM().setRegister("r3", 3);
    if(autoStart) loader.startVM();
    return loader;
}
Deno.test("ADD_REG_REG", function (): void {
    const b = makeBuilder();
    b.insert8(Instructions.ADD);
    b.insert8(additionType.ADD_REG_REG);
    b.insert32(b._regKeyToIndex("r1"));
    b.insert32(b._regKeyToIndex("r2"));
    assertEquals(makeLoader(b, true).getVM().getRegister("acc"), 3);
});