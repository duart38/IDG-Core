import { coordinatesByIndex, indexByCoordinates } from "./utils/coordinates.ts";

const test = [ // 5 x 3
    0,1,2,3,0,
    0,4,5,6,0,
    0,7,8,9,0,
]
let res = indexByCoordinates(2, 1, 5);
const [x,y] = coordinatesByIndex(res, 5);

console.log(res, x, y)
