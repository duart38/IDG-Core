import { assertEquals } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import { Direction } from "../../interfaces/Actions.ts";
import { combineRGB } from "../../utils/color.ts";
import Builder from "../Builder/Builder.ts";
import { NeighborRetrievalType } from "../Instructions/pixelRetrieval.ts";
import IDGLoader from "../Loader.ts";
import { Instructions } from "../Registers.ts";

/**
 * Just a little to build a basic builder to ensure we instructions don't collide.
 **/
 function makeBuilder(): Builder {
    return new Builder({width: 2, height: 2, imageData: [
        1,2,
        3,4
    ]}, 100000);
}
async function makeLoader(builder: Builder, autoStart = false){
    const loader = new IDGLoader(builder.compile());
    loader.getVM().setRegister("COL", combineRGB([255,0,0]));
    if(autoStart) await loader.startVM();
    return loader;
}

Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG LEFT", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.left);
    b.insert32(1); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 0); // pixel index 1
});
Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG topLeft", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.topLeft);
    b.insert32(3); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 0); // pixel index 1
});
Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG top", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.top);
    b.insert32(3); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 1); // pixel index 1
});

Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG 1", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.right);
    b.insert32(0); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 1); // pixel index 1
});


Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG 2 (vertical)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.bottom);
    b.insert32(0); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 2); // pixel index 1
});
Deno.test("NEIGHBORING_PIXEL_INDEX_TO_REG 3 (vertical)", async function () {
    const b = makeBuilder();
    b.insert8(Instructions.FETCH_PIXEL_NEIGHBOR);
    b.insert8(NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG);
    b.insert8(Direction.bottomRight);
    b.insert32(0); 
    b.insert32(b._regKeyToIndex("r1"));
    assertEquals((await makeLoader(b,true)).getVM().getRegister("r1"), 3); // pixel index 1
});



// Deno.test("MODIFY_PIXEL_MEM_MEM_MEM", async function () {
//     const b = makeBuilder();
//     const x = b.instructionIndex + 45;
//     b.MoveRegisterToMemory("x", x);

//     const y = b.instructionIndex;
//     b.MoveRegisterToMemory("y", y);

//     const col = b.instructionIndex;
//     b.MoveRegisterToMemory("COL", col);
    
//     b.insert8(Instructions.MODIFY_PIXEL);
//     b.insert8(PixelModificationType.MODIFY_PIXEL_MEM_MEM_MEM);
//     b.insert32(x);
//     b.insert32(y);
//     b.insert32(col);
//     assertEquals((await makeLoader(b,true)).getVM().imageCopy[0], combineRGB([255,0,0]));
// });
