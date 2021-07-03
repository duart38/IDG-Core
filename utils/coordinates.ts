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