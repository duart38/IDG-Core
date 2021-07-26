import IDGVM from "../Machine.ts";

export enum RandomType {
  RAND_LIT_LIT,
  RAND_REG_REG,
  RAND_MEM_MEM,
}

export function randomToAccumulator(_this: IDGVM, param: number[]) {
  switch (param[1]) {
    case RandomType.RAND_LIT_LIT: {
      const min = Math.ceil(param[2]);
      const max = Math.floor(param[3]);
      _this.setRegister(
        "acc",
        Math.floor(Math.random() * (max - min + 1) + min),
      );
      break;
    }
    case RandomType.RAND_REG_REG: {
      const min = Math.ceil(_this.getRegisterAt(param[2]));
      const max = Math.floor(_this.getRegisterAt(param[3]));
      _this.setRegister(
        "acc",
        Math.floor(Math.random() * (max - min + 1) + min),
      );
      break;
    }
    case RandomType.RAND_MEM_MEM: {
      const min = Math.ceil(_this.getMemoryAt(param[2]));
      const max = Math.floor(_this.getMemoryAt(param[3]));
      _this.setMemoryAt(
        param[4],
        Math.floor(Math.random() * (max - min + 1) + min),
      );
      break;
    }
  }
}
