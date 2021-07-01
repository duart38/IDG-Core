import Builder from "../../ImageBuilder/Builder.ts";
import IDGRuntime from "../../ImageBuilder/Runtime.ts";
import { arithmetic, direction } from "../../interfaces/Actions.ts";
import { indexByCoordinates } from "../../utils/coordinates.ts";

const CelBuilder = new Builder(20,20);
const w = CelBuilder.IDG.width - 1;
const h = CelBuilder.IDG.height - 1;
const RANDOM_SPAWN_AMOUNT = 20;


const randomGliderDown = [
    CelBuilder.randomNumber(0,0, 0 ,w, 69), // random X
    CelBuilder.randomNumber(0,0, 0, h, 70), // random Y
    CelBuilder.storeValue(0, 71, 0), // index from the coordinates
    // CelBuilder.coordinatesToIndex(1,1,  69,70,  69),

    CelBuilder.calculateAndStore(arithmetic.ADDITION, 1,0, 70, 1, 70), // Y + 1
    CelBuilder.coordinatesToIndex(1,1,  69,70,  71),
    CelBuilder.ifInBounds(71, [
        CelBuilder.modifyPixel(1, 71, [0,0,255, 255]),
    ]),
    

    CelBuilder.calculateAndStore(arithmetic.ADDITION, 1,0, 70, 1, 70), // Y + 1
    CelBuilder.calculateAndStore(arithmetic.ADDITION, 1,0, 69, 1, 69), // X + 1
    CelBuilder.coordinatesToIndex(1,1,  69,70,  71),
    CelBuilder.ifInBounds(71, [
        CelBuilder.modifyPixel(1, 71, [0,0,255, 255]),
    ]),


    CelBuilder.calculateAndStore(arithmetic.ADDITION, 1,0, 69, 1, 69), // X + 1
    CelBuilder.coordinatesToIndex(1,1,  69,70,  71),
    CelBuilder.ifInBounds(71, [
        CelBuilder.modifyPixel(1, 71, [0,0,255, 255]),
    ]),

    CelBuilder.calculateAndStore(arithmetic.SUBTRACTION, 1,0, 70, 1, 70), // Y - 1
    CelBuilder.coordinatesToIndex(1,1,  69,70,  71),
    CelBuilder.ifInBounds(71, [
        CelBuilder.modifyPixel(1, 71, [0,0,255, 255]),
    ]),

    CelBuilder.calculateAndStore(arithmetic.SUBTRACTION, 1,0, 70, 1, 70), // Y - 1
    CelBuilder.coordinatesToIndex(1,1,  69,70,  71),
    CelBuilder.ifInBounds(71, [
        CelBuilder.modifyPixel(1, 71, [0,0,255, 255]),
    ]),

    CelBuilder.render()
]

CelBuilder.addInstructions([
    CelBuilder.modifyPixel(0, indexByCoordinates(8,10,20), [0,0,0,255]),
    CelBuilder.modifyPixel(0, indexByCoordinates(9,10,20), [0,0,0,255]),
    CelBuilder.modifyPixel(0, indexByCoordinates(10,10,20),[0,0,0,255]),
    CelBuilder.render(),
    CelBuilder.storeValue(0, 17, 0),
    CelBuilder.storeValue(0, 80, 0),
    CelBuilder.randomNumber(0,0, 900,2000, 999), // random interval

    // lets spawn something based on an interval
    CelBuilder.atInterval(999, 1, 81, [
        ...randomGliderDown,
        CelBuilder.calculateAndStore(arithmetic.ADDITION, 1,0, 80, 1, 80), // increment amount of times we spawned
        CelBuilder.ifEquals(1,0, 80, RANDOM_SPAWN_AMOUNT, [
            CelBuilder.clearInterval(81)
        ])
    ]),


    CelBuilder.atInterval(800, 0, -1, [ // calculate game of life every "n" msecs
        CelBuilder.forEachPixel(0, [ // memory bank 0 -> index of loop
            // reset neighbor counter back to 0
            CelBuilder.storeValue(0, 17, 0),
            CelBuilder.storePixelOpacity(1, 0, 18), // mem bank 18 will stores current pixel opacity


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
                CelBuilder.calculateAndStore(arithmetic.ADDITION, 1, 0, 17, 1, 17),
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

            // 1. Any LIVE cell with fewer than two live neighbours dies, as if by underpopulation.
            CelBuilder.allTrue([
                CelBuilder.ifEquals(1,0, 18, 255, []), // live cell check.
                CelBuilder.ifLessThan(1,0, 17, 2, []), // fewer than 2 check on memory bank 17
            ], [
                CelBuilder.modifyPixel(1, 0, [0,0,0,0]) // index stored in memory bank 0 is loaded.
            ]),

            // 3. Any live cell with more than three live neighbours dies, as if by overpopulation.
            CelBuilder.allTrue([
                CelBuilder.ifEquals(1,0, 18, 255, []), // live cell check.
                CelBuilder.ifGreaterThan(1,0, 17, 3, []) // larger than 3 check on memory bank 17
            ], [
                CelBuilder.modifyPixel(1, 0, [255,255,255,250]) // index stored in memory bank 0 is loaded.
            ]),


            // 2. Any live cell with two or three live neighbours lives on to the next generation.
            CelBuilder.ifEquals(1,0, 18, 255, [ // is current pixel index alive?
                CelBuilder.ifEquals(1,0, 17, 2, [ // is neighbor 2 ?
                    // CelBuilder.modifyPixel(1, 0, [0,0,0,255]) // yes..
                ]),

                CelBuilder.ifEquals(1,0, 17, 3, [ // is neighbor 3?
                    CelBuilder.modifyPixel(1, 0, [0,0,0,255]) // yes
                ]),
            ]),

            // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
            CelBuilder.allTrue([
                CelBuilder.ifLessThan(1,0, 18, 255, []), // dead cell check. (<255)
                CelBuilder.ifEquals(1,0, 17, 3, []), // three neighbors
            ], [
                CelBuilder.modifyPixel(1, 0, [0,0,0,255]) // index stored in memory bank 0 is loaded.
            ])

        ]),
        CelBuilder.render() // render after we update the board

        
    ]),
]);

const x = new IDGRuntime(CelBuilder.IDG);
x.start();
