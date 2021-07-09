import { Direction } from "../interfaces/Actions.ts";

export function indexByCoordinates(x: number, y: number, w: number): number {
    return ((y * w) + x); // * 4;
}
export function coordinatesByIndex(i: number, width: number): [number, number]{
    //i = i / 4;
    let x = Math.floor(i % width);    // % is the "modulo operator", the remainder of i / width;
    let y = Math.floor(i / width);    // where "/" is an integer division
    return [x, y];
}
export function clamp(value: number, length: number): number{
    if(value > length) return length;
    if(value < 0) return 0;
    return value;
}

export function getNeighboringPixelIndex(direction: Direction, from: number, width: number) {
    switch(direction){
        case Direction.left: {
            // const [x,y] = coordinatesByIndex(from, width);
            // return indexByCoordinates(x-1, y, width);
            return from - 1;
        }
        case Direction.right: {
            // const [x,y] = coordinatesByIndex(from, width);
            // return indexByCoordinates(x+1, y, width);
            return from + 1;
        }
        case Direction.topLeft: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x-1, y-1, width);
        }
        case Direction.top: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x, y-1, width);
        }
        case Direction.topRight: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x+1, y-1, width);
        }
        case Direction.bottomRight: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x+1, y+1, width);
        }
        case Direction.bottom: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x, y+1, width);
        }
        case Direction.bottomLeft: {
            const [x,y] = coordinatesByIndex(from, width);
            return indexByCoordinates(x-1, y+1, width);
        }
        default: console.log("Invalid directional instruction");
    }
    return 0;
}