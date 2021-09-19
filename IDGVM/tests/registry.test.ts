import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import Builder from "../Builder/Builder.ts";
import IDGLoader from "../Loader.ts";
import { RegisterKey } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
 function makeBuilder(): Builder {
    return new Builder({width: 1, height: 1, imageData: [0]}, 100000);
}
const registersToTest: Record<string, number> = {
    "acc": Math.round(Math.random() * 100),
    "r1": Math.round(Math.random() * 100),
    "r2": Math.round(Math.random() * 100),
    "r3": Math.round(Math.random() * 100),
    "r4": Math.round(Math.random() * 100),
    "r5": Math.round(Math.random() * 100),
    "r6": Math.round(Math.random() * 100),
    "r7": Math.round(Math.random() * 100),
    "r8": Math.round(Math.random() * 100),
    "r9": Math.round(Math.random() * 100),
    "R": Math.round(Math.random() * 255),
    "G": Math.round(Math.random() * 255),
    "B": Math.round(Math.random() * 255),
    "COL": Math.round(Math.random() * 255),
    "x": Math.round(Math.random() * 255),
    "y": Math.round(Math.random() * 255),
}
async function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    // Some pre-population.
    for(const [key, value] of Object.entries(registersToTest)){
        loader.getVM().setRegister(key as RegisterKey, value);
    }
    if(autoStart) await loader.startVM();
    return loader;
}

Object.entries(registersToTest).forEach(([key, value]) => {
    const b = makeBuilder();
    Deno.test("Register r1 is addressable", async function () {
        assertEquals((await makeLoader(b,true)).getVM().getRegister(key as RegisterKey), value);
    });
})