import { U255 } from "../../interfaces/RGBA.ts";
import { combineRGB } from "../../utils/color.ts";
import IDGVM from "../Machine.ts";

export enum RGBConversionType {
    RGB_TO_COLOR_LIT_LIT_LIT,
    RGB_TO_COLOR_MEM_MEM_MEM,
    RGB_TO_COLOR_REG_REG_REG,
}

export function RGBConversion(_this: IDGVM, params: number[]){
    switch (params[1]) {
        case RGBConversionType.RGB_TO_COLOR_LIT_LIT_LIT: {
            const r = params[2] as U255;
            const g = params[3] as U255;
            const b = params[4] as U255;
            _this.setRegister("COL", combineRGB([r,g,b]));
            break;
        }
        case RGBConversionType.RGB_TO_COLOR_MEM_MEM_MEM: {
            const r = _this.getMemoryAt(params[2]) as U255;
            const g = _this.getMemoryAt(params[3]) as U255;
            const b = _this.getMemoryAt(params[4]) as U255;
            _this.setRegister("COL", combineRGB([r,g,b]));
            break;
        }
        case RGBConversionType.RGB_TO_COLOR_REG_REG_REG: {
            const r = _this.getRegisterAt(params[2]) as U255;
            const g = _this.getRegisterAt(params[3]) as U255;
            const b = _this.getRegisterAt(params[4]) as U255;
            _this.setRegister("COL", combineRGB([r,g,b]));
            break;
        }

    }
}
