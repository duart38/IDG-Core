export const REGISTERS = [
    'ip', 'acc',
    'r1', 'r2', 'r3', 'r4',
    'r5', 'r6', 'r7', 'r8',
    'sp', 'fp', 'mb', 'im'
];
export enum Instructions {
    // movement instructions
    MOV_LIT_REG     = 0x10,
    MOV_REG_REG     = 0x11,
    MOV_REG_MEM     = 0x12,
    MOV_MEM_REG     = 0x13,
    MOV_LIT_MEM     = 0x1B,
    MOV_REG_PTR_REG = 0x1C,
    MOV_LIT_OFF_REG = 0x1D,

    // arithmetic shenanigans
    ADD_REG_REG     = 0x14,
    ADD_LIT_REG     = 0x3F,
    SUB_LIT_REG     = 0x16,
    SUB_REG_LIT     = 0x1E,
    SUB_REG_REG     = 0x1F,
    INC_REG         = 0x35,
    DEC_REG         = 0x36,
    MUL_LIT_REG     = 0x20,
    MUL_REG_REG     = 0x21,

    // bitwise operations
    LSF_REG_LIT     = 0x26,
    LSF_REG_REG     = 0x27,
    RSF_REG_LIT     = 0x2A,
    RSF_REG_REG     = 0x2B,
    AND_REG_LIT     = 0x2E,
    AND_REG_REG     = 0x2F,
    OR_REG_LIT      = 0x30,
    OR_REG_REG      = 0x31,
    XOR_REG_LIT     = 0x32,
    XOR_REG_REG     = 0x33,
    NOT             = 0x34,

    // jumpy baby jump
    JMP_NOT_EQ      = 0x15,
    JNE_REG         = 0x40,
    JEQ_REG         = 0x3E,
    JEQ_LIT         = 0x41,
    JLT_REG         = 0x42,
    JLT_LIT         = 0x43,
    JGT_REG         = 0x44,
    JGT_LIT         = 0x45,
    JLE_REG         = 0x46,
    JLE_LIT         = 0x47,
    JGE_REG         = 0x48,
    JGE_LIT         = 0x49,

    // stack instructions
    PSH_LIT         = 0x17,
    PSH_REG         = 0x18,
    POP             = 0x1A,
    CAL_LIT         = 0x5E,
    CAL_REG         = 0x5F,
    RET             = 0x60,
    HLT             = 0xFF,
    RET_INT         = 0xFC,
    INT             = 0xFD,
}

