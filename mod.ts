import Builder from "./ImageBuilder/Builder.ts";
import IDGRuntime from "./ImageBuilder/Runtime.ts";
import { arithmetic, direction } from "./interfaces/Actions.ts";
import { indexByCoordinates } from "./utils/coordinates.ts";

const CelBuilder = new Builder(20,20);

// CelBuilder.addInstructions([
//     CelBuilder.storeValue(0, 0, 3000),
//     CelBuilder.modifyPixel(0, 0, [0,0,0,1]),
//     CelBuilder.render(),
//     CelBuilder.atInterval(0, 1, [
//         CelBuilder.modifyPixel(0, 0, [255,255,255,255]),
//         CelBuilder.render()
//     ])
// ]);

CelBuilder.addInstructions([
    CelBuilder.modifyPixel(indexByCoordinates(8,10,20) ,0,[0,0,0,255]),
    CelBuilder.modifyPixel(indexByCoordinates(9,10,20) ,0,[0,0,0,255]),
    CelBuilder.modifyPixel(indexByCoordinates(10,10,20) ,0,[0,0,0,255]),
    CelBuilder.render(),
    CelBuilder.storeValue(0, 17, 0),


    CelBuilder.atInterval(800, 0, [ // calculate game of life every "n" msecs
        CelBuilder.forEachPixel(0, [ // memory bank 0 -> index of loop
            // reset neighbor counter back to 0
            CelBuilder.storeValue(0, 17, 0),

            CelBuilder.getNeighboringPixel(1, 0, direction.topLeft, 1), // memory bank 1
            CelBuilder.getNeighboringPixel(1, 0, direction.top, 2), // memory bank 2
            CelBuilder.getNeighboringPixel(1, 0, direction.topRight, 3), // memory bank 3
            CelBuilder.getNeighboringPixel(1, 0, direction.left, 4), // memory bank 4
            CelBuilder.getNeighboringPixel(1, 0, direction.right, 5), // memory bank 5
            CelBuilder.getNeighboringPixel(1, 0, direction.bottomLeft, 6), // memory bank 6
            CelBuilder.getNeighboringPixel(1, 0, direction.bottom, 7), // memory bank 7
            CelBuilder.getNeighboringPixel(1, 0, direction.bottomRight, 8), // memory bank 8
    
            // memory banks storing alpha of neighbors
            CelBuilder.storePixelOpacity(1, 1, 9), // mem bank 9
            CelBuilder.storePixelOpacity(1, 2, 10), // mem bank 10
            CelBuilder.storePixelOpacity(1, 3, 11), // ""
            CelBuilder.storePixelOpacity(1, 4, 12), 
            CelBuilder.storePixelOpacity(1, 5, 13),
            CelBuilder.storePixelOpacity(1, 6, 14), 
            CelBuilder.storePixelOpacity(1, 7, 15), 
            CelBuilder.storePixelOpacity(1, 8, 16),
    
            // bank 17 will store amount of neighbors
            CelBuilder.ifEquals(1,0, 9, 255, [ // if value in bank 9 is 255
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 10, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 11, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 12, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 13, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 14, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 15, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
            CelBuilder.ifEquals(1,0, 16, 255, [
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17)
            ]),
    

            CelBuilder.storeValue(0, 19, 0), // bank 19 will store 1 if one of the 2 expressions below ran
            // if neighbors is bigger than 3 then overpopulation
            CelBuilder.ifGreaterThan(1,0, 17, 3, [
                CelBuilder.modifyPixel(0,1, [255,255,255,254]),
                CelBuilder.storeValue(0, 19, 1)
            ]),
            // if neighbors is smaller than 2 then dying of starvation
            CelBuilder.ifLessThan(1,0, 17, 2, [
                CelBuilder.modifyPixel(0,1, [255,255,255,254]),
                CelBuilder.storeValue(0, 19, 1)
            ]),


            CelBuilder.storePixelOpacity(1, 0, 18), // mem bank 18 will stores current pixel opacity
    
            // new born!!!
            // CelBuilder.ifLessThan(1,0, 19, 1, [ // if neither of the above ran (indicates by value in bank 19)
                // CelBuilder.ifEquals(1,0, 18, 0, [ // if bank 18 is invisible,
                    CelBuilder.ifEquals(1,0, 17, 3, [ // AND bank 17 has exactly 3 neighbors
                        CelBuilder.modifyPixel(0,1, [0,0,0, 255]) // change the current idx's (bank 0) alpha to 255
                    ]),
                // ]),
            // ]),

        ]),
        CelBuilder.render() // render after we update the board

        
    ]),
]);

const x = new IDGRuntime(CelBuilder.IDG);
x.start();
