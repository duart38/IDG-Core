import {RGB, U255} from "../interfaces/RGBA.ts";

//define a function to bound and round the input float value to 0-255
export function ByteClamp(v: number): U255 {
    if (v < 0)
        return 0;
    if (v > 255)
        return 255;
    return v as U255;
}

/**
 * Combines RGB into a single value resulting in smaller file sizes and potentially solving
 * tokenization issues.
 * @param input 
 */
export function combineRGB(input: RGB): number{
    return ((input[0]&0x0ff)<<16)|((input[1]&0x0ff)<<8)|(input[2]&0x0ff);
}
export function spreadRGB(input: number): RGB {
    let red = ((input>>16) & 0x0ff) as U255;
    let green = ((input>>8) & 0x0ff) as U255;
    let blue = ((input)    & 0x0ff) as U255;
    return [red, green, blue];
}

export function spreadImage(input: number[], alpha = false): number[] {
    let accumulator = [];

    for(let i = 0; i < input.length; i ++){
        const x = spreadRGB(input[i]);
        accumulator.push(x[0]);
        accumulator.push(x[1]);
        accumulator.push(x[2]);
        if(alpha)accumulator.push(255);
    }
    return accumulator;
}

export function hueShift(input: RGB, fHue: number): RGB {
    const out: RGB = [0,0,0];
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