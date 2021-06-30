import { instruction } from "./Actions.ts";

export interface FileShape {
    width: number, height: number
    imageMap: number[],
    memory: Record<number, number>,
    instructions: instruction[]
}