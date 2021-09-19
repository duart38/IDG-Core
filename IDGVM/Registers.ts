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
] as const;
export type RegisterKey = typeof REGISTERS[number];
export enum RegisterIndexOf {
  ip,
  acc,
  r1,
  r2,
  r3,
  r4,
  r5,
  r6,
  r7,
  r8,
  r9,
  R,
  G,
  B,
  COL,
  x,
  y,
  /**
   * Stores the loop index when in for-each like instruction
   */
  li,
  sp,
  fp,
  mb,
  im,
}
/**
 * Indicates all the states that will be pushed when we request to save the machine state
 */
export const PUSHABLE_STATE = REGISTERS.slice(0, RegisterIndexOf.y + 1);

export enum Instructions {
  // movement instructions
  MOVE = 1,
  MOVE_S, // move instruction but with signed values

  // arithmetic shenanigans
  // TODO: combine and use 8-bit to represent which of them we are referring to
  ADD,

  SUBTRACT,

  INC_REG,
  DEC_REG,
  MULTIPLY,

  // bitwise operations
  // TODO: combine and introduce 8-bit instr to indicate which one to target
  BITWISE_SHIFT,

  BITWISE_AND,
  BITWISE_OR,
  NOT,

  // jumpy baby jump
  /**
   * Jump based on the value in the accumulator against a condition
   **/
  JMP_ACC,
  // TODO: add separate jump instructions for checking against 2 locations instead of accumulator

  GOTO,

  // stack instructions
  PSH_LIT,
  PSH_REG,
  /**
   * @deprecated
   */
  PSH_STATE,
  POP,
  CALL,

  RET,
  RET_TO_NEXT,
  HLT,
  RET_INT,
  INT,
  PSH_IP,
  PSH_IP_OFFSETTED,

  // QOF instructions
  RAND,
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
  MODIFY_PIXEL_REG,
  /**
   * Modifies the pixel data, taking all values from the user (parameters)
   * */
  MODIFY_PIXEL,

  /**
   * Instructs VM to render the image (basically dumping the image copy into the image itself).
   * Also calls a callback that is always called when the original image is updated.
   */
  RENDER,
  SLEEP,

  FETCH_IMAGE_INFO,

  /**
   * Gets the neighboring pixel in a given direction and puts its index in the supplied register.
   */
  FETCH_PIXEL_NEIGHBOR,
  FETCH_PIXEL_COLOR_BY_INDEX,
  /**
   * Fetches a pixel index by the x and y values currently stored in the register.. stores it in the supplied register
   */
  FETCH_PIXEL_INDEX_BY_REG_COORDINATES,
  /**
   * Fetches the pixel index based on the supplied x,y locations or literals and stored in the provided location
   * Note: "FETCH_PIXEL_INDEX_BY_REG_COORDINATES" is preferred as it is more efficient (takes up less memory)
   * */
  FETCH_PIXEL_INDEX,
  /**
   * Converts the RGB value stored in the register to a combined RGB color and stores it in the COL register.
   * This instruction is more efficient than the "RGB_TO_COLOR" as it requires no parameters
   */
  RGB_FROMREG_TO_COLOR,
  /**
   * Converts the RGB literal (supplied) to a combined RGB color and stored it in the COL register.
   * Prefer this instruction over "RGB_FROMREG_TO_COLOR" as it is more efficient
   */
  RGB_TO_COLOR,
  /**
   * Converts the color value stored in the register COL to an RGB vector and spreads this in the r,g,b registers
   */
  COLOR_FROMREG_TO_RGB,

  DRAW_BOX,
  DRAW_BOX_MANUAL,
  DRAW_CIRCLE,
  // TODO: draw arc (curve)
  /**
   * Draws a line taking the x and the y of both points from 4 registers
   */

  DRAW_LINE_POINTS,

  // TODO: also make sure to include a zone mode (it cant introduce another parameter so figure out something else)
  MODIFY_LUMINOSITY,
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

  CONNECT_WS,
  // TODO: disconnect WS.
  /**
   * Bind to a websocket event and puts the results in a register or memory location.
   * NOTE: only supports receiving Blobs.
   */
  BIND_CONNECTED_WS,
  // TODO: unbinding support?
  DEBUG,
}

//        e.g.: [1, 4, 4] -> 8-bit, 32-bit, 32-bit, we would probably use an enum here instead of those values
//        the above is to be used with the upcoming yield (generator) functions
export enum ParameterFetchType {
  unsignedINT8,
  signedINT8,
  unsignedINT16,
  signedINT16,
  unsignedINT32,
  signedINT32,
  registerIndex,
  // TODO: add ignore types here so that the generator will skip the fetching of params and allow the individual instructions to fetch it themselves
  //      the above solves the signed value problem that causes some memory to not be addressable
}

/**
 * Includes the list of parameters (types) that the generator should fetch.
 * NOTE: Does not include the instruction itself as that has already been fetched at the time of querying this object
 */
export const InstructionParams: ParameterFetchType[][] = [
  // TODO: fetch number from network instruction (this does not seem that problematic)
  [],
  /** [Instructions.MOVE]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.MOVE_S]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.signedINT32, // TODO: consequence-> we can't fully address the entire memory space
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.ADD]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.SUBTRACT]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.INC_REG]:*/ [ParameterFetchType.signedINT32],
  /** [Instructions.DEC_REG]:*/ [ParameterFetchType.signedINT32],
  /** [Instructions.MULTIPLY]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.BITWISE_SHIFT]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.BITWISE_AND]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.BITWISE_OR]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.NOT]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.JMP_ACC]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.GOTO]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.PSH_LIT]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.PSH_REG]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.PSH_STATE]:*/ [],
  /** [Instructions.POP]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.CALL]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.RET]:*/ [],
  /** [Instructions.RET_TO_NEXT]:*/ [],
  /** [Instructions.HLT]:*/ [],
  /** [Instructions.RET_INT]:*/ [],
  /** [Instructions.INT]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.PSH_IP]:*/ [],
  /** [Instructions.PSH_IP_OFFSETTED]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.RAND]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.SKIP]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.INTERVAL]:*/ [
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.MODIFY_PIXEL_REG]:*/ [], // takes all values from the register
  /** [Instructions.MODIFY_PIXEL]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.RENDER]:*/ [],
  /** [Instructions.SLEEP]:*/ [ParameterFetchType.unsignedINT32],
  /** [Instructions.FETCH_IMAGE_INFO]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.FETCH_PIXEL_NEIGHBOR]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ], // type, direction, where to check, where to put
  /** [Instructions.FETCH_PIXEL_COLOR_BY_INDEX]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES]:*/ [
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.FETCH_PIXEL_INDEX]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.RGB_FROMREG_TO_COLOR]:*/ [],
  /** [Instructions.RGB_TO_COLOR]:*/ [ // TODO: make a literal version that takes 8bit vals instead
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT32, // TODO: this is wasteful as the RGB depth is only 8bits per channel.
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.COLOR_FROMREG_TO_RGB]:*/ [],
  /** [Instructions.DRAW_BOX]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
  ],
  /** [Instructions.DRAW_BOX_MANUAL]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.DRAW_CIRCLE]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT16,
  ],
  /** [Instructions.DRAW_LINE_POINTS]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
    ParameterFetchType.unsignedINT16,
  ],
  /** [Instructions.MODIFY_LUMINOSITY]:*/ [
    ParameterFetchType.unsignedINT8,
    ParameterFetchType.signedINT32,
  ],
  /** [Instructions.LANGTONS_ANT]:*/ [
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.SEEDS]:*/ [
    ParameterFetchType.unsignedINT32,
    ParameterFetchType.unsignedINT32,
  ],
  /** [Instructions.CONNECT_WS]:*/ [
    ParameterFetchType.unsignedINT32, // size of url str
    // -> gets the rest of the uint8array encoded string based on the size.
  ],
  /** [Instructions.BIND_CONNECTED_WS]:*/ [
    ParameterFetchType.unsignedINT8, // type -> where to bind
    ParameterFetchType.unsignedINT32, // addr
    ParameterFetchType.unsignedINT32, // size of url str
    // -> gets the rest of the uint8array encoded string based on the size.
  ],
  /** [Instructions.DEBUG]:*/ [ParameterFetchType.unsignedINT8],

  // TODO: SHAPE: [type, amountOfPointsToFetch].. the points need to be fetched dynamically so we can decide to do it with the fetch ins or inside our generator based on the amountOfPointsToFetch value
];
