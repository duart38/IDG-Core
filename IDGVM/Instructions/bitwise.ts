import IDGVM from "../Machine.ts";

export enum shiftType {
  LSF_REG_LIT,
  LSF_REG_REG,
  LSF_REG_MEM,
  LSF_MEM_LIT,
  LSF_MEM_REG,

  RSF_REG_LIT,
  RSF_REG_REG,
  RSF_REG_MEM,
  RSF_MEM_LIT,
  RSF_MEM_REG,
}
export enum andType {
  AND_REG_LIT,
  AND_REG_REG,
  AND_REG_MEM,
  AND_MEM_REG,
  AND_LIT_MEM,
  AND_MEM_LIT
}
export enum orType {
  OR_REG_LIT,
  OR_REG_REG,
  OR_LIT_MEM,
  OR_REG_MEM,
  OR_MEM_LIT,
  OR_MEM_REG,

  XOR_REG_LIT,
  XOR_REG_REG,
  XOR_LIT_MEM,
  // TODO: XOR_REG_MEM,
}

export function bitwiseShift(_this: IDGVM, param: number[]) {
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
    case shiftType.LSF_REG_MEM: {
      const r1 = param[2];
      const mem = param[3];
      const oldValue = _this.getRegisterAt(r1);
      _this.setRegisterAt(r1, oldValue << _this.getMemoryAt(mem));
      break;
    }
    case shiftType.LSF_MEM_LIT: {
      const mem = param[2];
      const literal = param[3];
      const oldValue = _this.getMemoryAt(mem);
      _this.setMemoryAt(mem, oldValue << literal);
      break;
    }
    case shiftType.LSF_MEM_REG: {
      const mem = param[2];
      const r2 = param[3];
      const oldValue = _this.getMemoryAt(mem);
      _this.setMemoryAt(mem, oldValue << _this.getRegisterAt(r2));
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
    case shiftType.RSF_REG_MEM: {
      const r1 = param[2];
      const mem = param[3];
      const oldValue = _this.getRegisterAt(r1);
      _this.setRegisterAt(r1, oldValue >> _this.getMemoryAt(mem));
      break;
    }
    case shiftType.RSF_MEM_LIT: {
      const mem = param[2];
      const literal = param[3];
      const oldValue = _this.getMemoryAt(mem);
      _this.setMemoryAt(mem, oldValue >> literal);
      break;
    }
    case shiftType.RSF_MEM_REG: {
      const mem = param[2];
      const r2 = param[3];
      const oldValue = _this.getMemoryAt(mem);
      _this.setMemoryAt(mem, oldValue >> _this.getRegisterAt(r2));
      break;
    }
  }
}

export function bitwiseAND(_this: IDGVM, param: number[]) {
  switch (param[1]) {
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
    case andType.AND_REG_MEM: {
      const r1 = param[2];
      const mem = param[3];
      const r1V = _this.getRegisterAt(r1);
      const r2V = _this.getMemoryAt(mem);
      _this.setRegister("acc", r1V & r2V);
      break;
    }
    case andType.AND_MEM_REG: {
      const mem = param[2];
      const r2 = param[3];
      const r2V = _this.getRegisterAt(r2);
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV & r2V);
      break;
    }
    case andType.AND_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV & literal); 
      break;
    }
    case andType.AND_MEM_LIT: {
      const mem = param[2];
      const literal = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV & literal);
      break;
    }
  }
}

export function bitwiseOR(_this: IDGVM, param: number[]) {
  switch (param[1]) {
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
    case orType.OR_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV | literal);
      break;
    }
    case orType.OR_REG_MEM: {
      const r1 = param[2];
      const mem = param[3];
      const r1V = _this.getRegisterAt(r1);
      const r2V = _this.getMemoryAt(mem);
      _this.setRegister("acc", r1V | r2V);
      break;
    }
    case orType.OR_MEM_LIT: {
      const mem = param[2];
      const literal = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV | literal);
      break;
    }
    case orType.OR_MEM_REG: {
      const mem = param[2];
      const r2 = param[3];
      const r2V = _this.getRegisterAt(r2);
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV | r2V);
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
    case orType.XOR_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV ^ literal);
      break;
    }
  }
}
