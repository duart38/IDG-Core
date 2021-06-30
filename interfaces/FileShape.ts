import { instruction } from "./Actions.ts";

export interface FileShape {
    width: number, height: number
    imageMap: number[],
    instructions: instruction[]
}