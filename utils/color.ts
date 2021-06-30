import {RGBA, U255} from "../interfaces/RGBA.ts";

//define a function to bound and round the input float value to 0-255
export function ByteClamp(v: number): U255 {
    if (v < 0)
        return 0;
    if (v > 255)
        return 255;
    return v as U255;
}

export function hueShift(input: RGBA, fHue: number): RGBA {
    const out: RGBA = [0,0,0,0];
    const cosA = Math.cos(fHue*3.14159265/180); //convert degrees to radians
    const sinA = Math.sin(fHue*3.14159265/180); //convert degrees to radians
    //calculate the rotation matrix, only depends on Hue
    const matrix: number[][] = [
        [cosA + (1.0 - cosA) / 3.0, 1.0/3.0 * (1.0 - cosA) - Math.sqrt(1.0/3.0) * sinA, 1.0/3.0 * (1.0 - cosA) + Math.sqrt(1.0/3.0) * sinA],
        [1.0/3.0 * (1.0 - cosA) + Math.sqrt(1.0/3.0) * sinA, cosA + 1.0/3.0*(1.0 - cosA), 1.0/3.0 * (1.0 - cosA) - Math.sqrt(1.0/3.0) * sinA],
        [1.0/3.0 * (1.0 - cosA) - Math.sqrt(1.0/3.0) * sinA, 1.0/3.0 * (1.0 - cosA) + Math.sqrt(1.0/3.0) * sinA, cosA + 1.0/3.0 * (1.0 - cosA)]
    ];
    //Use the rotation matrix to convert the RGB directly
    out[0] = ByteClamp(input[0] * matrix[0][0] + input[1] * matrix[0][1] + input[2]*matrix[0][2]);
    out[1] = ByteClamp(input[0] * matrix[1][0] + input[1] * matrix[1][1] + input[2]*matrix[1][2]);
    out[2] = ByteClamp(input[0] * matrix[2][0] + input[1] * matrix[2][1] + input[2]*matrix[2][2]);
    return out;
}