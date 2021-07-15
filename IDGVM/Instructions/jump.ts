import IDGVM from "../Machine.ts";

export enum AccJumpType {
    /** 
     * Jump if the provided literal is not equals to the value in the accumulator.
     */
    JNE_LIT,
    /**
     * Jump if the value in the provided register is not equals to the value in the accumulator.
     **/
    JNE_REG,
    /**
     * Jump if the value in the provided register is equal to the value in the accumulator.
     * */
    JEQ_REG,
    /**
     * Jump if the literal value provided is equal to the value in the accumulator.
     */
    JEQ_LIT,
    /**
     * Jump if the value in the register provided is less that the value in the accumulator.
     */
    JLT_REG,
    /**
     * Jump if the literal provided is less that the value in the accumulator.
     */
    JLT_LIT,
    JGT_REG,
    JGT_LIT,
    JLE_REG,
    JLE_LIT,
    JGE_REG,
    JGE_LIT,
}

export enum CallType {
    CAL_LIT,
    CAL_REG,
    CAL_MEM
}

export function jumpBasedOnAcc(_this: IDGVM, param: number[]){
    switch(param[1]){
        case AccJumpType.JNE_LIT: {
            const value = param[2];
            const address = param[3];
            if (value !== _this.getRegister('acc')) {
              _this.pushIp();
              _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JNE_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value !== _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JEQ_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value === _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JEQ_LIT: {
            const value = param[2];
            const address = param[3];
            if (value === _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JLT_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value < _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JLT_LIT: {
            const value = param[2];
            const address = param[3];
            if (value < _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JGT_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value > _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JGT_LIT: {
            const value = param[2];
            const address = param[3];
            if (value > _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JLE_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value <= _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JLE_LIT: {
            const value = param[2];
            const address = param[3];
            if (value <= _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JGE_REG: {
            const value = _this.getRegisterAt(param[2]);
            const address = param[3];
            if (value >= _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
        case AccJumpType.JGE_LIT: {
            const value = param[2];
            const address = param[3];
            if (value >= _this.getRegister('acc')) {
                _this.pushIp();
                _this.setRegister('ip', address);
            }
            break;
        }
    }
}


export function callALocation(_this: IDGVM, param: number[]){
    switch(param[1]){
        case CallType.CAL_LIT: {
            const address = param[2];
            _this.pushIp();
            _this.setRegister('ip', address);
            break;
        }
        case CallType.CAL_REG: {
            const address = _this.getRegisterAt(param[2]);
            _this.pushIp();
            _this.setRegister('ip', address);
            break;
        }
        case CallType.CAL_MEM: {
            const address = _this.getMemoryAt(param[2]);
            _this.pushIp();
            _this.setRegister('ip', address);
            break;
        }
    }            
}