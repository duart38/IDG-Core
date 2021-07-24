import IDGVM from "../Machine.ts";

export enum shiftType {
    LSF_REG_LIT,
    LSF_REG_REG,
    RSF_REG_LIT,
    RSF_REG_REG,
}
export enum andType {
    AND_REG_LIT,
    AND_REG_REG,
    // TODO: AND_REG_MEM
    // TODO: AND_MEM_REG
    // TODO: AND_LIT_MEM
    // TODO: AND_MEM_LIT
}
export enum orType {
    OR_REG_LIT,
    OR_REG_REG,
    XOR_REG_LIT,
    XOR_REG_REG,
    // TODO: OR_LIT_MEM
    // TODO: OR_REG_MEM
    // TODO: OR_MEM_LIT
    // TODO: XOR_LIT_MEM
    // TODO: XOR_REG_MEM
}

export function bitwiseShift(_this: IDGVM, param: number[]){
    switch (param[1]) {
        case shiftType.LSF_REG_LIT: {
            const r1 = param[2];
            const literal = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue << literal);
            break;
        }
        case shiftType.LSF_REG_REG: {
            const r1 = param[2];
            const r2 = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue << _this.getRegisterAt(r2));
            break;
        }
        case shiftType.RSF_REG_LIT: {
            const r1 = param[2];
            const literal = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue >> literal);
            break;
        }
        case shiftType.RSF_REG_REG: {
            const r1 = param[2];
            const r2 = param[3];
            const oldValue = _this.getRegisterAt(r1);
            _this.setRegisterAt(r1, oldValue >> _this.getRegisterAt(r2));
            break;
        }
    }
}

export function bitwiseAND(_this: IDGVM, param: number[]){
    switch(param[1]) {
        case andType.AND_REG_LIT: {
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V & literal);
            break;
        }
        case andType.AND_REG_REG: {
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V & r2V);
            break;
        }
    }
}

export function bitwiseOR(_this: IDGVM, param: number[]){
    switch(param[1]) {
        case orType.OR_REG_LIT: {
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V | literal);
            break;
    }
        case orType.OR_REG_REG: {
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V | r2V);
            break;
        }
        case orType.XOR_REG_LIT: {
            const r1 = param[2];
            const literal = param[3];
            const r1V = _this.getRegisterAt(r1);
            _this.setRegister("acc", r1V ^ literal);
            break;
        }
        case orType.XOR_REG_REG: {
            const r1 = param[2];
            const r2 = param[3];
            const r1V = _this.getRegisterAt(r1);
            const r2V = _this.getRegisterAt(r2);
            _this.setRegister("acc", r1V ^ r2V);
            break;
        }
    }
}