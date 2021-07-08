/**
 * ip = instruction pointer (pc), indicates where we are
 * acc = place where results of math operations will land (accumulator)
 * r1..n = registers<n> , small temp storage on the CPU, could be used to sotre all the neighboring pixel colors
 * R,G,B = registers are for instructions that store Red, Green, Blue values.
 * COL = storage for combined RGB value also called the color value which represents the RGB as a single number
 * fp = points to the beginning of a stack frame (frame pointer)
 * sp = stack pointer
 */
export const REGISTERS = <const> [
  "ip", // 0
  "acc", // 1
  "r1", // 2
  "r2", // 3
  "r3", // 4
  "r4", // 5
  "r5", // 6
  "r6", // 7
  "r7", // 8
  "r8", // 9
  "r9", // 10
  "R", // 11
  "G", // 12
  "B", // 13
  "COL", // 14
  "x", // 15
  "y", // 16
  "li", // 17
  "sp",
  "fp",
  "mb",
  "im",
];
export type RegisterKey = typeof REGISTERS[number];
export enum RegisterIndexOf {
  ip, acc,
  r1, r2, r3, r4, r5, r6, r7, r8, r9,
  R, G, B, COL, x, y,
  /**
   * Stores the loop index when in for-each like instruction
   */
  li,
  sp, fp, mb, im,
}
/**
 * Indicates all the states that will be pushed when we request to save the machine state
 */
export const PUSHABLE_STATE = REGISTERS.slice(0, RegisterIndexOf.y + 1);
console.log("pushable state", PUSHABLE_STATE);

export enum Instructions {
  // movement instructions
  MOV_LIT_REG = 1, // shift to make all instructions values go after 1.. 0 is for un-initialized
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
  GOTO,

  // stack instructions
  PSH_LIT,
  PSH_REG,
  PSH_STATE,
  POP,
  CAL_LIT,
  CAL_REG,
  RET,
  RET_TO_NEXT,
  HLT,
  RET_INT,
  INT,

  // QOF instructions
  RAND, // TODO: RAND_REG_REG
  SKIP,
  /**
   * Starts an interval that when its time, executes the address provided.
   * Currently will only run if the machine is still in execution mode (i.e. not halted). this means that
   * if the machine has reached the end of the memory and thus stops executing (or saw too many empty instructions) this method
   * will stop executing as the machine will go into a halted state
   */
  INTERVAL,


  // TODO: dump to disk (.idg or internal) instruction. this ins is problematic as in some cases (browser) you would not be able to persist data

  // image specific instructions
  /**
   * Modifies the pixel data by taking values from the registers (x,y,COL)
   */
  MODIFY_PIXEL,
  /**
   * Instructs VM to render the image (basically dumping the image copy into the image itself).
   * Also calls a callback that is always called when the original image is updated.
   */
  RENDER,
  IMAGE_WIDTH_REG,
  IMAGE_HEIGHT_REG,
  /** Also known as the surface (i.e. width * height) */
  IMAGE_TOTAL_PIXELS_REG,
  /**
   * Gets the neighboring pixel in a given direction and puts its index in the supplied register.
   */
  NEIGHBORING_PIXEL_INDEX_TO_REG,
  NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG,
  /**
   * Fetches the pixel color from the supplied index and dumps it into the COL register
   */
  FETCH_PIXEL_COLOR_BY_INDEX,
  FETCH_PIXEL_COLOR_BY_REGISTER_INDEX,
  /**
   * Fetches a pixel index by the x and y values currently stored in the register.. stores it in the supplied register
   */
  FETCH_PIXEL_INDEX_BY_REG_COORDINATES,
  /**
   * Converts the RGB value stored in the register to a combined RGB color and stores it in the COL register
   */
  RGB_FROMREG_TO_COLOR,
  /**
   * Converts the RGB literal (supplied) to a combined RGB color and stored it in the COL register.
   * NOTE: consider using this instruction instead of manually pushing things to the register. this method takes less space.
   */
  RGB_LIT_TO_COLOR,
  /**
   * Converts the color value stored in the register COL to an RGB vector and spreads this in the r,g,b registers
   */
  COLOR_FROMREG_TO_RGB,
  /**
   * Draws a box at the x,y offset that is stored in the register.
   * This instruction takes the color of the values stored in the COL register (NOT THE RGB ONE!!).
   * Supplied are width and height
   */
  DRAW_BOX,

}

/**
 * Helper used for providing information about a specific instruction. can be used for parsing
 * size -> the size in bytes that this instruction takes..
 */
export const InstructionInformation: Record<Instructions, {size: number}> = {
    [Instructions.MOV_LIT_REG]: {size: 9},
    [Instructions.MOV_REG_REG]: {size: 9},
    [Instructions.MOV_REG_MEM]: {size: 9},
    [Instructions.MOV_MEM_REG]: {size: 9},
    [Instructions.MOV_LIT_MEM]: {size: 9},
    [Instructions.MOV_REG_PTR_REG]: {size: 9},
    [Instructions.MOV_LIT_OFF_REG]: {size: 13},
    [Instructions.ADD_REG_REG]: {size: 9},
    [Instructions.ADD_LIT_REG]: {size: 9},
    [Instructions.SUB_LIT_REG]: {size: 9},
    [Instructions.SUB_REG_LIT]: {size: 9},
    [Instructions.SUB_REG_REG]: {size: 9},
    [Instructions.INC_REG]: {size: 5},
    [Instructions.DEC_REG]: {size: 5},
    [Instructions.MUL_LIT_REG]: {size: 9},
    [Instructions.MUL_REG_REG]: {size: 9},
    [Instructions.LSF_REG_LIT]: {size: 9},
    [Instructions.LSF_REG_REG]: {size: 9},
    [Instructions.RSF_REG_LIT]: {size: 6},
    [Instructions.RSF_REG_REG]: {size: 9},
    [Instructions.AND_REG_LIT]: {size: 9},
    [Instructions.AND_REG_REG]: {size: 9},
    [Instructions.OR_REG_LIT]: {size: 9},
    [Instructions.OR_REG_REG]: {size: 9},
    [Instructions.XOR_REG_LIT]: {size: 9},
    [Instructions.XOR_REG_REG]: {size: 9},
    [Instructions.NOT]: {size: 5},
    [Instructions.JMP_NOT_EQ]: {size: 9},
    [Instructions.JNE_REG]: {size: 9},
    [Instructions.JEQ_REG]: {size: 9},
    [Instructions.JEQ_LIT]: {size: 9},
    [Instructions.JLT_REG]: {size: 9},
    [Instructions.JLT_LIT]: {size: 9},
    [Instructions.JGT_REG]: {size: 9},
    [Instructions.JGT_LIT]: {size: 9},
    [Instructions.JLE_REG]: {size: 9},
    [Instructions.JLE_LIT]: {size: 9},
    [Instructions.JGE_REG]: {size: 9},
    [Instructions.JGE_LIT]: {size: 9},
    [Instructions.GOTO]: {size: 5},
    [Instructions.PSH_LIT]: {size: 5},
    [Instructions.PSH_REG]: {size: 5},
    [Instructions.PSH_STATE]: {size: 1},
    [Instructions.POP]: {size: 5},
    [Instructions.CAL_LIT]: {size: 5},
    [Instructions.CAL_REG]: {size: 5},
    [Instructions.RET]: {size: 1},
    [Instructions.RET_TO_NEXT]: {size: 1},
    [Instructions.HLT]: {size: 1},
    [Instructions.RET_INT]: {size: 1},
    [Instructions.INT]: {size: 5},
    [Instructions.RAND]: {size: 9},
    [Instructions.SKIP]: {size: 5},
    [Instructions.MODIFY_PIXEL]: {size: 1},
    [Instructions.RENDER]: {size: 1},
    [Instructions.NEIGHBORING_PIXEL_INDEX_TO_REG]: {size: 10},
    [Instructions.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG]: {size: 10},
    [Instructions.FETCH_PIXEL_COLOR_BY_INDEX]: {size: 5},
    [Instructions.FETCH_PIXEL_COLOR_BY_REGISTER_INDEX]: {size: 5},
    [Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES]: {size: 5},
    [Instructions.RGB_FROMREG_TO_COLOR]: {size: 1},
    [Instructions.RGB_LIT_TO_COLOR]: {size: 4},
    [Instructions.COLOR_FROMREG_TO_RGB]: {size: 1},
    [Instructions.IMAGE_WIDTH_REG]: {size: 5},
    [Instructions.IMAGE_HEIGHT_REG]: {size: 5},
    [Instructions.IMAGE_TOTAL_PIXELS_REG]: {size: 5},
    [Instructions.DRAW_BOX]: {size: 9},
    [Instructions.INTERVAL]: {size: 9}
}