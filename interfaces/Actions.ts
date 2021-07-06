/**
 * Since JSON supports true and false but we don't want to store it as such..
 */
export type bool = 0 | 1;
export enum arithmetic {
 ADDITION, SUBTRACTION, DIVISION, MULTIPLICATION,
 BITSHIFT_LEFT, BITSIGNEDSHIFT_RIGHT, BITSHIFT_RIGHT, BIT_AND, BIT_OR, BIT_XOR, BIT_NOT
}
/**
* Direction from the current position
*/
export enum Direction {
    topLeft, top, topRight,
    left, /** idx */ right,
    bottomLeft, bottom, bottomRight
}