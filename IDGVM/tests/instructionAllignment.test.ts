/**
 * 
 * Serves to test if all the instructions stays in place.
 * If one instruction shifts it will be almost impossible to figure out
 * where it shifted to and what other instructions are affected, to add insult to
 * injury, if the issue was not immediately discovered and people start using the
 * instruction then it will even be hard to change it back without breaking production code.
 * 
 * */

 import { assert } from "https://deno.land/std@0.102.0/testing/asserts.ts";
 import { Instructions } from "../Registers.ts";

const BASE_INS = [
    "MOVE",
    "MOVE_S",
    "ADD",
    "SUBTRACT",
    "INC_REG",
    "DEC_REG",
    "MULTIPLY",
    "BITWISE_SHIFT",
    "BITWISE_AND",
    "BITWISE_OR",
    "NOT",
    "JMP_ACC",
    "GOTO",
    "PSH_LIT",
    "PSH_REG",
    "PSH_STATE",
    "POP",
    "CALL",
    "RET",
    "RET_TO_NEXT",
    "HLT",
    "RET_INT",
    "INT",
    "PSH_IP",
    "PSH_IP_OFFSETTED",
    "RAND",
    "SKIP",
    "INTERVAL",
    "MODIFY_PIXEL_REG",
    "MODIFY_PIXEL",
    "RENDER",
    "SLEEP",
    "FETCH_IMAGE_INFO",
    "FETCH_PIXEL_NEIGHBOR",
    "FETCH_PIXEL_COLOR_BY_INDEX",
    "FETCH_PIXEL_INDEX_BY_REG_COORDINATES",
    "FETCH_PIXEL_INDEX",
    "RGB_FROMREG_TO_COLOR",
    "RGB_TO_COLOR",
    "COLOR_FROMREG_TO_RGB",
    "DRAW_BOX",
    "DRAW_BOX_MANUAL",
    "DRAW_CIRCLE",
    "DRAW_LINE_POINTS",
    "MODIFY_LUMINOSITY",
    "LANGTONS_ANT",
    "SEEDS",
    "DEBUG",
]

function readEnum<T>(value: T){
    return Object.entries(value).filter(v=>typeof v[1] === "number");
}

function checkIfMatch<T>(enumBase: T, expected: string[]){
    const actualIns = readEnum(enumBase);
    return expected.every((v, staticIdx)=>{
        const foundIdx = actualIns.find(([actualKey, _actualV])=>actualKey === v);
        if(!foundIdx){
            console.error(`\ninstruction ${v} not found in:`, actualIns);
            return false;
        }
        if(Instructions[foundIdx[0] as keyof typeof Instructions] !== staticIdx+1){
            console.error(`\ninstruction ${v} is misaligned Actual:${foundIdx}, Expected:${staticIdx+1}`);
            return false;
        }
        return true;
    });
}

Deno.test("Base instruction alignment", function () {
    assert(checkIfMatch(Instructions, BASE_INS), "All instructions are aligned");
});
