import Builder from "./ImageBuilder/Builder.ts";
import IDGRuntime from "./ImageBuilder/Runtime.ts";

const CelBuilder = new Builder(2,2);
CelBuilder.addInstructions([
    CelBuilder.storeValue(0, 0, 3000),
    CelBuilder.modifyPixel(0, 0, [0,0,0,1]),
    CelBuilder.render(),
    CelBuilder.atInterval(0, 1, [
        CelBuilder.modifyPixel(0, 0, [255,255,255,255]),
        CelBuilder.render()
    ])
]);

const x = new IDGRuntime(CelBuilder.IDG);
x.start();

