import { instruction } from "./Actions.ts";

export interface FileShape {
    imageMap: number[],
    instructions: instruction[]
}