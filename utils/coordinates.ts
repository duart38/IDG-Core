import IDGVM from "../IDGVM/Machine.ts";
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

function slopeOf(x1: number, y1: number, x2: number, y2: number){
    return (y2-y1) / (y2-x1);
}

function plotLineLow(_this: IDGVM, x0: number, y0: number, x1: number, y1:number){
    const dx = x1 - x0
    let dy = y1 - y0
    let yi = 1
    const color = _this.getRegister("COL");
    if(dy < 0){
        yi = -1
        dy = -dy
    }

    let D = (2 * dy) - dx
    let y = y0

    for(let x = x0; x < x1 + 1; x++){
        //plot(x, y)
        _this.setPixelColor(indexByCoordinates(x,y,_this.image.width), color);
        if(D > 0){
            y = y + yi
            D = D + (2 * (dy - dx))
        }else{
            D = D + 2*dy
        }
    }      
}

function plotLineHigh(_this: IDGVM, x0: number, y0: number, x1: number, y1:number){
    const color = _this.getRegister("COL");
    let dx = x1 - x0
    const dy = y1 - y0
    let xi = 1
    if(dx < 0){
        xi = -1
        dx = -dx
    }

    let D = (2 * dx) - dy
    let x = x0

    for(let y = y0; y < y1 + 1; y++){ // for y from y0 to y1
        _this.setPixelColor(indexByCoordinates(x,y,_this.image.width), color);
        if(D > 0){
            x = x + xi
            D = D + (2 * (dx - dy))
        }else{
            D = D + 2*dx
        }
    }
}


export function drawLine(_this: IDGVM, x0: number, y0: number, x1: number, y1:number){
    if(Math.abs(y1 - y0) < Math.abs(x1 - x0)){ //if abs(y1 - y0) < abs(x1 - x0)
        if(x0 > x1) plotLineLow(_this, x1, y1, x0, y0)
        else plotLineLow(_this, x0, y0, x1, y1)
    }else{
        if (y0 > y1) plotLineHigh(_this, x1, y1, x0, y0)
        else plotLineHigh(_this, x0, y0, x1, y1)
    }
}