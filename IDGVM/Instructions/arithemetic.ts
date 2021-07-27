import IDGVM from "../Machine.ts";

export enum additionType {
  ADD_REG_REG,
  ADD_LIT_REG,
  ADD_REG_LIT,
  ADD_LIT_MEM,
  ADD_REG_MEM,
  ADD_LIT_LIT,
  ADD_MEM_MEM,
  // TODO: in-place instructions
}

export enum subtractionType {
  SUB_REG_REG,
  SUB_LIT_REG,
  SUB_REG_LIT,
  SUB_LIT_MEM,
  SUB_REG_MEM,
  SUB_MEM_REG,
  SUB_MEM_LIT,
  SUB_MEM_MEM,
  // TODO: in-place instructions
}

export enum multiplicationType {
  MUL_REG_REG,
  MUL_LIT_REG,
  MUL_LIT_MEM,
  MUL_REG_MEM,
  MUL_MEM_REG,
  MUL_MEM_LIT,
  MUL_REG_LIT,
  MUL_LIT_LIT,
  MUL_MEM_MEM,
}
export function subtraction(_this: IDGVM, param: number[]) {
  switch (param[1]) {
    case subtractionType.SUB_REG_REG: {
      const r1 = param[2];
      const r2 = param[3];
      const lhs = _this.getRegisterAt(r1); // first registers are always the lhs
      const rhs = _this.getRegisterAt(r2);
      _this.setRegister("acc", lhs - rhs);
      break;
    }
    case subtractionType.SUB_LIT_REG: {
      const literal = param[2];
      const r1 = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", literal - r1V);
      break;
    }
    case subtractionType.SUB_REG_LIT: {
      const r1 = param[2];
      const literal = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", r1V - literal);
      break;
    }
    case subtractionType.SUB_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", literal - memV);
      break;
    }
    case subtractionType.SUB_REG_MEM: {
      // sub r1, [mem]
      const r1 = param[2];
      const mem = param[3];
      const r1V = _this.getRegisterAt(r1);
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", r1V - memV);
      break;
    }
    case subtractionType.SUB_MEM_REG: {
      // sub [mem], r1
      const mem = param[2];
      const r1 = param[3];
      const memV = _this.getMemoryAt(mem);
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", memV - r1V);
      break;
    }
    case subtractionType.SUB_MEM_LIT: {
      // sub [mem], literal
      const mem = param[2];
      const literal = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV - literal);
      break;
    }
    case subtractionType.SUB_MEM_MEM: {
      // sub [mem], [mem2]
      const mem1 = param[2];
      const mem2 = param[3];
      const mem1V = _this.getMemoryAt(mem1);
      const mem2V = _this.getMemoryAt(mem2);
      _this.setRegister("acc", mem1V - mem2V);
      break;
    }
  }
}

/**
 * adds two things together
 * @param param [instruction, additionType, param, param]
 */
export function addition(_this: IDGVM, param: number[]) {
  switch (param[1]) {
    // add register to register
    case additionType.ADD_REG_REG: {
      const r1 = param[2];
      const r2 = param[3];
      const lhs = _this.getRegisterAt(r1);
      const rhs = _this.getRegisterAt(r2);
      _this.setRegister("acc", lhs + rhs);
      break;
    }

    // add literal to register

    case additionType.ADD_LIT_REG: {
      const literal = param[2];
      const r1 = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", literal + r1V);
      break;
    }

    // adds a literal to memory

    case additionType.ADD_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", literal + memV);
      break;
    }

    case additionType.ADD_REG_MEM: {
      // add r1, [mem]
      const r1 = param[2];
      const mem = param[3];
      const r1V = _this.getRegisterAt(r1);
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", r1V + memV);
      break;
    }
    case additionType.ADD_REG_LIT: {
      const r1 = param[2];
      const literal = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", literal + r1V);
      break;
    }
    case additionType.ADD_MEM_MEM: {
      // add [mem], [mem2]
      const mem1 = param[2];
      const mem2 = param[3];
      const mem1V = _this.getMemoryAt(mem1);
      const mem2V = _this.getMemoryAt(mem2);
      _this.setRegister("acc", mem1V + mem2V);
      break;
    }
    case additionType.ADD_LIT_LIT: {
      const literal = param[2];
      const literal2 = param[3];
      _this.setRegister("acc", literal + literal2);
      break;
    }
  }
}

// do the same thing for the multiply instructions
export function multiplication(_this: IDGVM, param: number[]) {
  // do the same thing for the multiply instructions
  switch (param[1]) {
    case multiplicationType.MUL_REG_REG: {
      const r1 = param[2];
      const r2 = param[3];
      const lhs = _this.getRegisterAt(r1);
      const rhs = _this.getRegisterAt(r2);
      _this.setRegister("acc", lhs * rhs);
      break;
    }
    case multiplicationType.MUL_LIT_REG: {
      const literal = param[2];
      const r1 = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", literal * r1V);
      break;
    }
    case multiplicationType.MUL_LIT_MEM: {
      const literal = param[2];
      const mem = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", literal * memV);
      break;
    }
    case multiplicationType.MUL_REG_MEM: {
      // mul r1, [mem]
      const r1 = param[2];
      const mem = param[3];
      const r1V = _this.getRegisterAt(r1);
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", r1V * memV);
      break;
    }
    case multiplicationType.MUL_MEM_REG: {
      // mul [mem], r1
      const mem = param[2];
      const r1 = param[3];
      const memV = _this.getMemoryAt(mem);
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", memV * r1V);
      break;
    }
    case multiplicationType.MUL_MEM_LIT: {
      // mul [mem], literal
      const mem = param[2];
      const literal = param[3];
      const memV = _this.getMemoryAt(mem);
      _this.setRegister("acc", memV * literal);
      break;
    }
    case multiplicationType.MUL_REG_LIT: {
      // mul r1, literal
      const r1 = param[2];
      const literal = param[3];
      const r1V = _this.getRegisterAt(r1);
      _this.setRegister("acc", r1V * literal);
      break;
    }
    case multiplicationType.MUL_LIT_LIT: {
      // mul literal, literal
      const literal = param[2];
      const literal2 = param[3];
      _this.setRegister("acc", literal * literal2);
      break;
    }
    case multiplicationType.MUL_MEM_MEM: {
      // mul [mem], [mem]
      const mem1 = param[2];
      const mem2 = param[3];
      const mem1V = _this.getMemoryAt(mem1);
      const mem2V = _this.getMemoryAt(mem2);
      _this.setRegister("acc", mem1V * mem2V);
      break;
    }
  }
}
