/**
 * 
 * Serves to test if all the instructions stays in place.
 * If one instruction shifts it will be almost impossible to figure out
 * where it shifted to and what other instructions are affected, to add insult to
 * injury, if the issue was not immediately discovered and people start using the
 * instruction then it will even be hard to change it back without breaking production code.
 * NOTE: if you encounter the above issue you can always re-compile your code.. it should adapt all instruction numbers.
 * */

 import { assert } from "https://deno.land/std@0.102.0/testing/asserts.ts";
import { additionType, multiplicationType, subtractionType } from "../Instructions/arithemetic.ts";
import { shiftType } from "../Instructions/bitwise.ts";
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

function checkIfMatch<T>(enumBase: T, expected: string[], offset = 0){
    const actualIns = readEnum(enumBase);
    return expected.every((v, staticIdx)=>{
        const foundIdx = actualIns.find(([actualKey, _actualV])=>actualKey === v);
        if(!foundIdx){
            console.error(`\ninstruction ${v} not found in:`, actualIns);
            return false;
        }
        // @ts-ignore 
        if(enumBase[foundIdx[0]] !== staticIdx+offset){
            console.error(`\ninstruction ${v} is misaligned Actual:${foundIdx}, Expected:${staticIdx+offset}`);
            return false;
        }
        return true;
    });
}

Deno.test("Base instruction alignment", function () {
    assert(checkIfMatch(Instructions, BASE_INS, 1), "All instructions are aligned");
});

const ADDITION_TYPE = [
    "ADD_REG_REG",
    "ADD_LIT_REG",
    "ADD_REG_LIT",
    "ADD_LIT_MEM",
    "ADD_REG_MEM",
    "ADD_LIT_LIT",
    "ADD_MEM_MEM",
]
Deno.test("additionType instruction alignment", function () {
    assert(checkIfMatch(additionType, ADDITION_TYPE), "All instructions are aligned");
});

const SUBTRACTION_TYPE = [
    "SUB_REG_REG",
    "SUB_LIT_REG",
    "SUB_REG_LIT",
    "SUB_LIT_MEM",
    "SUB_REG_MEM",
    "SUB_MEM_REG",
    "SUB_MEM_LIT",
    "SUB_MEM_MEM",
]
Deno.test("subtractionType instruction alignment", function () {
    assert(checkIfMatch(subtractionType, SUBTRACTION_TYPE), "All instructions are aligned");
});

const MULTIPLICATION_TYPE = [
    "MUL_REG_REG",
    "MUL_LIT_REG",
    "MUL_LIT_MEM",
    "MUL_REG_MEM",
    "MUL_MEM_REG",
    "MUL_MEM_LIT",
    "MUL_REG_LIT",
    "MUL_LIT_LIT",
    "MUL_MEM_MEM",
]
Deno.test("multiplicationType instruction alignment", function () {
    assert(checkIfMatch(multiplicationType, MULTIPLICATION_TYPE), "All instructions are aligned");
});

const SHIFT_TYPE = [
    "LSF_REG_LIT",
    "LSF_REG_REG",
    "LSF_REG_MEM",
    "LSF_MEM_LIT",
    "LSF_MEM_REG",
    "RSF_REG_LIT",
    "RSF_REG_REG",
    "RSF_REG_MEM",
    "RSF_MEM_LIT",
    "RSF_MEM_REG",
]
Deno.test("shiftType instruction alignment", function () {
    assert(checkIfMatch(shiftType, SHIFT_TYPE), "All instructions are aligned");
});