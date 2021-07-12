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
  // TODO: combine, use 8-bit value to know which one we are referring to
  MOV_LIT_REG = 1, // shift to make all instructions values go after 1.. 0 is for un-initialized
  MOV_REG_REG,
  MOV_REG_MEM,
  MOV_MEM_REG,
  MOV_LIT_MEM,
  MOV_REG_PTR_REG, // TODO: not very needed
  MOV_LIT_OFF_REG, // TODO: not very needed

  // arithmetic shenanigans
  // TODO: combine and use 8-bit to represent which of them we are referring to
  ADD_REG_REG,
  // TODO: ADD_REG_MEM (after we combine)
  // TODO: ADD_LIT_MEM (after we combine)
  ADD_LIT_REG,
  SUB_LIT_REG,
  SUB_REG_LIT,
  SUB_REG_REG,
  // TODO: SUB_REG_MEM (after we combine)
  // TODO: SUB_MEM_REG (after we combine)
  // TODO: SUB_LIT_MEM (after we combine)
  // TODO: SUB_MEM_LIT (after we combine)
  INC_REG,
  DEC_REG,
  MUL_LIT_REG,
  MUL_REG_REG,
  // TODO: MUL_LIT_MEM (after we combine)
  // TODO: MUL_LIT_REG (after we combine)

  // bitwise operations
  // TODO: combine and introduce 8-bit instr to indicate which one to target
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
  // TODO: combine all of these together and represent the "type" with an 8-bit integer. also include types for storing outside of the acc
  JMP_NOT_EQ, // TODO: rename to JNE_LIT (but must be combined, see above todo)
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
  /**
   * @deprecated
   */
  PSH_STATE,
  POP,
  CAL_LIT,
  CAL_REG,
  RET,
  RET_TO_NEXT,
  HLT,
  RET_INT,
  INT,
  PSH_IP,
  PSH_IP_OFFSETTED,

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
  SLEEP,


  // TODO: combine IMAGE_*. including todo's
  IMAGE_WIDTH_REG,
  // TODO: IMAGE_WIDTH_MEM
  IMAGE_HEIGHT_REG,
  // TODO: IMAGE_HEIGHT_MEM 
  IMAGE_TOTAL_PIXELS_REG,
  // TODO: IMAGE_TOTAL_PIXELS_MEM

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

  // TODO: combine draw instructions aswell 
  /**
   * Draws a box at the x,y offset that is stored in the register.
   * This instruction takes the color of the values stored in the COL register (NOT THE RGB ONE!!).
   * Supplied are width and height
   */
  DRAW_BOX,
  DRAW_CIRCLE,
  // TODO: draw arc (curve)
  /**
   * Draws a line taking the x and the y of both points from 4 registers
   */
  DRAW_LINE_P1REG_P2REG,
  DRAW_LINE_P1LIT_P2LIT,

  SHIFT_PIXEL_LIT,


  // TODO: combine
  INCREASE_PIXEL_LUMINOSITY_REG,
  DECREASE_PIXEL_LUMINOSITY_REG, // TODO: introduce singed integer and combine with increasing by using negative values
  INCREASE_IMAGE_LUMINOSITY_REG,
  DECREASE_IMAGE_LUMINOSITY_REG,
  // TODO: adjust R
  // TODO: adjust G
  // TODO: adjust B



  // TODO: instruction to define (bounds) in which a certain action can take place (https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm)
  // TODO: fill bounds
  // TODO: apply blur to bounds (based on kernel)
  // TODO: 


  /////// MISC ///////////
  /**
   * apply langton's ANT for 1 generation on the values in the x and y registers (modifies them afterwards)
   * supplied are the colors you want to apply to.
   * currently r9 register holds the directional value
   * @todo make one of these for values in a color range
   */
  LANGTONS_ANT,
  SEEDS,

  DEBUG,

}


// TODO: add a map here that indicates for each instructions the size of the parameters they take
//        e.g.: [1, 4, 4] -> 8-bit, 32-bit, 32-bit, we would probably use an enum here instead of those values
//        the above is to be used with the upcoming yield (generator) functions


/**
 * Helper used for providing information about a specific instruction. can be used for parsing
 * size -> the size in bytes that this instruction takes..
 */
export const InstructionInformation: Record<Instructions, {size: number, desc: string}> = {
    [Instructions.PSH_IP]: {size: 1, desc: "Push instruction pointer to stack"},
    [Instructions.PSH_IP_OFFSETTED]: {size: 5, desc: "Push instruction pointer with, an offset applied, to the stack"},
    [Instructions.DEBUG]: {size: 2, desc: "!debug!"},
    [Instructions.MOV_LIT_REG]: {size: 9, desc: "move a literal value to register"},
    [Instructions.MOV_REG_REG]: {size: 9, desc: "move a register to a register"},
    [Instructions.MOV_REG_MEM]: {size: 9, desc: "move register to a memory location"},
    [Instructions.MOV_MEM_REG]: {size: 9, desc: "move memory to a register"},
    [Instructions.MOV_LIT_MEM]: {size: 9, desc: "move literal to memory"},
    [Instructions.MOV_REG_PTR_REG]: {size: 9, desc: "move register pointer to a memory"},
    [Instructions.MOV_LIT_OFF_REG]: {size: 13, desc: ""},
    [Instructions.ADD_REG_REG]: {size: 9, desc: "Add register to register and store in acc"},
    [Instructions.ADD_LIT_REG]: {size: 9, desc: "Add literal to register and store in acc"},
    [Instructions.SUB_LIT_REG]: {size: 9, desc: "Subtract literal from register and store in acc"},
    [Instructions.SUB_REG_LIT]: {size: 9, desc: "subtract reg from literal and store in acc"},
    [Instructions.SUB_REG_REG]: {size: 9, desc: "subtract reg from reg and store in acc"},
    [Instructions.INC_REG]: {size: 5, desc: "increment register in place"},
    [Instructions.DEC_REG]: {size: 5, desc: "decrement register in place"},
    [Instructions.MUL_LIT_REG]: {size: 9, desc: "multiply literal by register and store in acc"},
    [Instructions.MUL_REG_REG]: {size: 9, desc: "multiply register by register and store in acc"},
    [Instructions.LSF_REG_LIT]: {size: 9, desc: "left shift reg by literal in place"},
    [Instructions.LSF_REG_REG]: {size: 9, desc: "left shift reg by reg and store in first reg"},
    [Instructions.RSF_REG_LIT]: {size: 6, desc: "right shift reg by lit and store in place"},
    [Instructions.RSF_REG_REG]: {size: 9, desc: "right shift reg by reg and store in first"},
    [Instructions.AND_REG_LIT]: {size: 9, desc: "reg & lit -> acc"},
    [Instructions.AND_REG_REG]: {size: 9, desc: "reg & reg -> acc"},
    [Instructions.OR_REG_LIT]: {size: 9, desc: "reg OR lit -> acc"},
    [Instructions.OR_REG_REG]: {size: 9, desc: "reg OR reg -> acc"},
    [Instructions.XOR_REG_LIT]: {size: 9, desc: "reg XOR lit -> acc"},
    [Instructions.XOR_REG_REG]: {size: 9, desc: "reg XOR reg -> acc"},
    [Instructions.NOT]: {size: 5, desc: "reg bitwise-NOT reg -> acc"},
    [Instructions.JMP_NOT_EQ]: {size: 9, desc: "Jump if literal not equals to acc"},
    [Instructions.JNE_REG]: {size: 9, desc: "Jump if regV not equals to acc"},
    [Instructions.JEQ_REG]: {size: 9, desc: "Jump if regV is equals to acc"},
    [Instructions.JEQ_LIT]: {size: 9, desc: "Jump if literal is equal to acc"},
    [Instructions.JLT_REG]: {size: 9, desc: "Jump if regV is less than acc"},
    [Instructions.JLT_LIT]: {size: 9, desc: "Jump if literal is less than acc"},
    [Instructions.JGT_REG]: {size: 9, desc: "Jump if regV is greater than acc"},
    [Instructions.JGT_LIT]: {size: 9, desc: "Jump if literal is greater than acc"},
    [Instructions.JLE_REG]: {size: 9, desc: "Jump if regV is less than or equal to acc"},
    [Instructions.JLE_LIT]: {size: 9, desc: "Jump if literal is less than or equal to acc"},
    [Instructions.JGE_REG]: {size: 9, desc: "Jump if regV is greater than or equal to acc"},
    [Instructions.JGE_LIT]: {size: 9, desc: "Jump if literal is greater than or equal to acc"},
    [Instructions.GOTO]: {size: 5, desc: "Go to address"},
    [Instructions.PSH_LIT]: {size: 5, desc: "push a literal unto the stack"},
    [Instructions.PSH_REG]: {size: 5, desc: "push a regV to the stack"},
    [Instructions.PSH_STATE]: {size: 1, desc: "push all register state values on the stack"},
    [Instructions.POP]: {size: 5, desc: "pop one item from the stack"},
    [Instructions.CAL_LIT]: {size: 5, desc: "call a literal address"},
    [Instructions.CAL_REG]: {size: 5, desc: "call an address from the value of a register"},
    [Instructions.RET]: {size: 1, desc: "return from a subroutine"},
    [Instructions.RET_TO_NEXT]: {size: 1, desc: "return from a subroutine but increment ip by one"},
    [Instructions.HLT]: {size: 1, desc: "halt the machine"},
    [Instructions.RET_INT]: {size: 1, desc: "return from an interup"},
    [Instructions.INT]: {size: 5, desc: "interrupt"},
    [Instructions.RAND]: {size: 9, desc: "get a random number and store it in acc"},
    [Instructions.SKIP]: {size: 5, desc: "skip instructions"},
    [Instructions.MODIFY_PIXEL]: {size: 1, desc: "modify a pixel"},
    [Instructions.RENDER]: {size: 1, desc: "request a render"},
    [Instructions.SHIFT_PIXEL_LIT]: {size: 2, desc: "shift a pixel in a given direction"},
    [Instructions.NEIGHBORING_PIXEL_INDEX_TO_REG]: {size: 10, desc: "gets a neighboring pixel stores it in a register"},
    [Instructions.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG]: {size: 10, desc: "gets a neighboring pixel stores it in a register"},
    [Instructions.FETCH_PIXEL_COLOR_BY_INDEX]: {size: 5, desc: "Fetch pixel color by index (literal) and store in COL"},
    [Instructions.FETCH_PIXEL_COLOR_BY_REGISTER_INDEX]: {size: 5, desc: "pixel color by registerV and store in COL"},
    [Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES]: {size: 5, desc: "pixel color by register 'x','y' -> COL"},
    [Instructions.RGB_FROMREG_TO_COLOR]: {size: 1, desc: "RGB_FROMREG_TO_COLOR"},
    [Instructions.RGB_LIT_TO_COLOR]: {size: 4, desc: "RGB_LIT_TO_COLOR"},
    [Instructions.COLOR_FROMREG_TO_RGB]: {size: 1, desc: "COLOR_FROMREG_TO_RGB"},
    [Instructions.IMAGE_WIDTH_REG]: {size: 5, desc: "IMAGE_WIDTH_REG"},
    [Instructions.IMAGE_HEIGHT_REG]: {size: 5, desc: "IMAGE_HEIGHT_REG"},
    [Instructions.INCREASE_PIXEL_LUMINOSITY_REG]: {size: 5, desc: "INCREASE_PIXEL_LUMINOSITY_REG"},
    [Instructions.DECREASE_PIXEL_LUMINOSITY_REG]: {size: 5, desc: "DECREASE_PIXEL_LUMINOSITY_REG"},
    [Instructions.INCREASE_IMAGE_LUMINOSITY_REG]: {size: 5, desc: "INCREASE_IMAGE_LUMINOSITY_REG"},
    [Instructions.DECREASE_IMAGE_LUMINOSITY_REG]: {size: 5, desc: "DECREASE_IMAGE_LUMINOSITY_REG"},
    [Instructions.IMAGE_TOTAL_PIXELS_REG]: {size: 5, desc: "IMAGE_TOTAL_PIXELS_REG"},
    [Instructions.DRAW_BOX]: {size: 9, desc: "DRAW_BOX"},
    [Instructions.DRAW_LINE_P1REG_P2REG]: {size: 17, desc: "Draw line between 2 points fetched from register"},
    [Instructions.DRAW_LINE_P1LIT_P2LIT]: {size: 17, desc: "Draw line between 2 points fetched from 4 literal values"},
    [Instructions.DRAW_CIRCLE]: {size: 5, desc: "DRAW_CIRCLE"},
    [Instructions.INTERVAL]: {size: 9, desc: "INTERVAL"},
    [Instructions.SLEEP]: {size: 5, desc: "SLEEP"},
    [Instructions.LANGTONS_ANT]: {size: 9 , desc: "Apply langtons ant for one generation"},
    [Instructions.SEEDS]: {size: 9 , desc: "Apply Seeds by Brian Silverman"},
}