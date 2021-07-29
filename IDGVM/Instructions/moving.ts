import IDGVM from "../Machine.ts";

export enum moveType {
  MOV_LIT_REG,
  MOV_REG_REG,
  MOV_REG_MEM,
  MOV_MEM_REG,
  MOV_LIT_MEM,
  MOV_MEM_MEM,
}
export enum SMoveType {
  MOV_SLIT_REG,
  MOV_SREG_REG,
  MOV_SREG_MEM,
  MOV_SMEM_REG,
  MOV_SLIT_MEM,
}
/**
 * @param param [instruction, moveType, param, param]
 */
export function executeMove(_this: IDGVM, param: number[]) {
  switch (param[1]) {
    // Move literal value into register
    case moveType.MOV_LIT_REG: {
      const literal = param[2];
      const register = param[3];
      _this.setRegisterAt(register, literal);
      break;
    }

    // Move a registers value to another registers value

    case moveType.MOV_REG_REG: {
      const registerFrom = param[2];
      const registerTo = param[3];
      const value = _this.getRegisterAt(registerFrom);
      _this.setRegisterAt(registerTo, value);
      break;
    }

    // Move a registers value to a location in memory

    case moveType.MOV_REG_MEM: {
      const registerFrom = param[2];
      const address = param[3];
      const value = _this.getRegisterAt(registerFrom);
      _this.setMemoryAt(address, value);
      break;
    }

    // Move the value of a memory location to a register

    case moveType.MOV_MEM_REG: {
      const address = param[2];
      const registerTo = param[3];
      const value = _this.getMemoryAt(address);
      _this.setRegisterAt(registerTo, value);
      break;
    }

    // Move a literal value to a memory location

    case moveType.MOV_LIT_MEM: {
      const value = param[2];
      const address = param[3];
      _this.setMemoryAt(address, value);
      break;
    }
    case moveType.MOV_MEM_MEM: {
      const addressFrom = param[2];
      const addressTo = param[3];
      const value = _this.getMemoryAt(addressFrom);
      _this.setMemoryAt(addressTo, value);
      break;
    }
  }
}

// TODO: will this even work? literals are signed but registers and mems are unsigned can we mix and match them?
export function executeSignedMove(_this: IDGVM, param: number[]) {
  switch (param[1]) {
    // Move literal value into register
    case moveType.MOV_LIT_REG: {
      const literal = param[2];
      const register = param[3];
      _this.setSignedRegisterAt(register, literal);
      break;
    }

    // Move a registers value to another registers value

    case moveType.MOV_REG_REG: {
      const registerFrom = param[2];
      const registerTo = param[3];
      const value = _this.getSignedRegisterAt(registerFrom);
      _this.setSignedRegisterAt(registerTo, value);
      break;
    }

    // Move a registers value to a location in memory

    case moveType.MOV_REG_MEM: {
      const registerFrom = param[2];
      const address = param[3];
      const value = _this.getSignedRegisterAt(registerFrom);
      _this.setSignedMemoryAt(address, value);
      break;
    }

    // Move the value of a memory location to a register

    case moveType.MOV_MEM_REG: {
      const address = param[2];
      const registerTo = param[3];
      const value = _this.getSignedMemoryAt(address);
      _this.setSignedRegisterAt(registerTo, value);
      break;
    }

    // Move a literal value to a memory location

    case moveType.MOV_LIT_MEM: {
      const value = param[2];
      const address = param[3];
      _this.setSignedMemoryAt(address, value);
      break;
    }
  }
}
