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
import { andType, orType, shiftType } from "../Instructions/bitwise.ts";
import { RGBConversionType } from "../Instructions/color.ts";
import { RandomType } from "../Instructions/helper.ts";
import { ImageInfoFetchType } from "../Instructions/imageInformation.ts";
import { AccJumpType, CallType } from "../Instructions/jump.ts";
import { moveType, SMoveType } from "../Instructions/moving.ts";
import { LuminosityModificationType, PixelModificationType } from "../Instructions/pixelModification.ts";
import { NeighborRetrievalType, PixelColorByIndexType, PixelIndexFetchType } from "../Instructions/pixelRetrieval.ts";
import { ManualRectangleDrawingType, RectangleDrawingType } from "../Instructions/shapes.ts";
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

const AND_TYPE = [
    "AND_REG_LIT",
    "AND_REG_REG",
    "AND_REG_MEM",
    "AND_MEM_REG",
    "AND_LIT_MEM",
    "AND_MEM_LIT",
]
Deno.test("andType instruction alignment", function () {
    assert(checkIfMatch(andType, AND_TYPE), "All instructions are aligned");
});

const OR_TYPE = [
    "OR_REG_LIT",
    "OR_REG_REG",
    "OR_LIT_MEM",
    "OR_REG_MEM",
    "XOR_REG_LIT",
    "XOR_REG_REG",
    "XOR_LIT_MEM",
    "XOR_REG_MEM",
]
Deno.test("orType instruction alignment", function () {
    assert(checkIfMatch(orType, OR_TYPE), "All instructions are aligned");
});


const RGB_CONVERSION_TYPE = [
    "RGB_TO_COLOR_LIT_LIT_LIT",
    "RGB_TO_COLOR_MEM_MEM_MEM",
    "RGB_TO_COLOR_REG_REG_REG",
]
Deno.test("RGBConversionType instruction alignment", function () {
    assert(checkIfMatch(RGBConversionType, RGB_CONVERSION_TYPE), "All instructions are aligned");
});

const RANDOM_TYPE = [
    "RAND_LIT_LIT",
    "RAND_REG_REG",
    "RAND_MEM_MEM",
]
Deno.test("RandomType instruction alignment", function () {
    assert(checkIfMatch(RandomType, RANDOM_TYPE), "All instructions are aligned");
});

const IMAGE_INFO_FETCH_TYPE = [
    "IMAGE_WIDTH_REG",
    "IMAGE_WIDTH_MEM",
    "IMAGE_HEIGHT_REG",
    "IMAGE_HEIGHT_MEM",
    "IMAGE_TOTAL_PIXELS_REG",
    "IMAGE_TOTAL_PIXELS_MEM",
]
Deno.test("ImageInfoFetchType instruction alignment", function () {
    assert(checkIfMatch(ImageInfoFetchType, IMAGE_INFO_FETCH_TYPE), "All instructions are aligned");
});

const ACC_JUMP_TYPE = [
   "JNE_LIT",
   "JNE_REG",
   "JEQ_REG",
   "JEQ_LIT",
   "JLT_REG",
   "JLT_LIT",
   "JGT_REG",
   "JGT_LIT",
   "JLE_REG",
   "JLE_LIT",
   "JGE_REG",
   "JGE_LIT",
];
Deno.test("AccJumpType instruction alignment", function () {
    assert(checkIfMatch(AccJumpType, ACC_JUMP_TYPE), "All instructions are aligned");
});

const CALL_TYPE = [
    "CAL_LIT",
    "CAL_REG",
    "CAL_MEM",
];
Deno.test("CallType instruction alignment", function () {
    assert(checkIfMatch(CallType, CALL_TYPE), "All instructions are aligned");
});

const MOVE_TYPE = [
    "MOV_LIT_REG",
    "MOV_REG_REG",
    "MOV_REG_MEM",
    "MOV_MEM_REG",
    "MOV_LIT_MEM",
    "MOV_MEM_MEM",
];
Deno.test("moveType instruction alignment", function () {
    assert(checkIfMatch(moveType, MOVE_TYPE), "All instructions are aligned");
});

const SMOVE_TYPE = [
    "MOV_SLIT_REG",
    "MOV_SREG_REG",
    "MOV_SREG_MEM",
    "MOV_SMEM_REG",
    "MOV_SLIT_MEM",
];
Deno.test("SMoveType instruction alignment", function () {
    assert(checkIfMatch(SMoveType, SMOVE_TYPE), "All instructions are aligned");
});

const PIXEL_MODIFICATION_TYPE = [
    "MODIFY_PIXEL_REG_REG_REG",
    "MODIFY_PIXEL_LIT_LIT_LIT",
    "MODIFY_PIXEL_MEM_MEM_MEM",
];
Deno.test("PixelModificationType instruction alignment", function () {
    assert(checkIfMatch(PixelModificationType, PIXEL_MODIFICATION_TYPE), "All instructions are aligned");
});

const LUMINOSITY_MODIFICATION_TYPE = [
    "MODIFY_PIXEL_LUMINOSITY_REG",
    "MODIFY_PIXEL_LUMINOSITY_MEM",
    "MODIFY_PIXEL_LUMINOSITY_LIT",
    "MODIFY_IMAGE_LUMINOSITY_REG",
    "MODIFY_IMAGE_LUMINOSITY_MEM",
    "MODIFY_IMAGE_LUMINOSITY_LIT",
];
Deno.test("LuminosityModificationType instruction alignment", function () {
    assert(checkIfMatch(LuminosityModificationType, LUMINOSITY_MODIFICATION_TYPE), "All instructions are aligned");
});

const NEIGHBOR_RETRIEVAL_TYPE = [
    "NEIGHBORING_PIXEL_INDEX_TO_REG",
    "NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG",
]
Deno.test("NeighborRetrievalType instruction alignment", function () {
    assert(checkIfMatch(NeighborRetrievalType, NEIGHBOR_RETRIEVAL_TYPE), "All instructions are aligned");
});

const PIXEL_COLOR_BY_INDEX_TYPE = [
    "FETCH_PIXEL_COLOR_REG",
    "FETCH_PIXEL_COLOR_MEM",
    "FETCH_PIXEL_COLOR_LIT",
]
Deno.test("PixelColorByIndexType instruction alignment", function () {
    assert(checkIfMatch(PixelColorByIndexType, PIXEL_COLOR_BY_INDEX_TYPE), "All instructions are aligned");
});

const PIXEL_INDEX_FETCH_TYPE = [
    "FETCH_PIXEL_INDEX_REG_REG",
    "FETCH_PIXEL_INDEX_LIT_LIT",
    "FETCH_PIXEL_INDEX_MEM_MEM",
]

Deno.test("PixelIndexFetchType instruction alignment", function () {
    assert(checkIfMatch(PixelIndexFetchType, PIXEL_INDEX_FETCH_TYPE), "All instructions are aligned");
});

const RECTANGLE_DRAWING_TYPE = [
    "DRAW_BOX_WLIT_HLIT",
    "DRAW_BOX_WREG_HREG",
]
Deno.test("RectangleDrawingType instruction alignment", function () {
    assert(checkIfMatch(RectangleDrawingType, RECTANGLE_DRAWING_TYPE), "All instructions are aligned");
});

const MANUAL_RECTANGLE_DRAWING_TYPE = [
    "DRAW_BOX_LIT_LIT_LIT_LIT_LIT"
]
Deno.test("ManualRectangleDrawingType instruction alignment", function () {
    assert(checkIfMatch(ManualRectangleDrawingType, MANUAL_RECTANGLE_DRAWING_TYPE), "All instructions are aligned");
});