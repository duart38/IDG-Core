/**
 * ip = instruction pointer (pc), indicates where we are
 * acc = place where results of math operations will land (accumulator)
 * r1..n = registers<n> , small temp storage on the CPU, could be used to sotre all the neighboring pixel colors
 * R,G,B = registers are for instructions that store Red, Green, Blue values.
 * COL = storage for combined RGB value also called the color value which represents the RGB as a single number
 * fp = points to the beginning of a stack frame (frame pointer)
 * sp = stack pointer
 */
export const REGISTERS = [
  "ip",
  "acc",
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "r7",
  "r8",
  "r9",
  "R",
  "G",
  "B",
  "COL",
  "x",
  "y",
  "sp",
  "fp",
  "mb",
  "im",
];

export enum Instructions {
  // movement instructions
  MOV_LIT_REG,
  MOV_REG_REG,
  MOV_REG_MEM,
  MOV_MEM_REG,
  MOV_LIT_MEM,
  MOV_REG_PTR_REG,
  MOV_LIT_OFF_REG,

  // arithmetic shenanigans
  ADD_REG_REG,
  ADD_LIT_REG,
  SUB_LIT_REG,
  SUB_REG_LIT,
  SUB_REG_REG,
  INC_REG,
  DEC_REG,
  MUL_LIT_REG,
  MUL_REG_REG,

  // bitwise operations
  LSF_REG_LIT,
  LSF_REG_REG,
  RSF_REG_LIT,
  RSF_REG_REG,
  AND_REG_LIT,
  AND_REG_REG,
  OR_REG_LIT,
  OR_REG_REG,
  XOR_REG_LIT,
  XOR_REG_REG,
  NOT,

  // jumpy baby jump
  JMP_NOT_EQ,
  JNE_REG,
  JEQ_REG,
  JEQ_LIT,
  JLT_REG,
  JLT_LIT,
  JGT_REG,
  JGT_LIT,
  JLE_REG,
  JLE_LIT,
  JGE_REG,
  JGE_LIT,

  // stack instructions
  PSH_LIT,
  PSH_REG,
  POP,
  CAL_LIT,
  CAL_REG,
  RET,
  HLT,
  RET_INT,
  INT,

  // QOF instructions
  RAND,
  SKIP,
}
