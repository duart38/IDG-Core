
/**
 * Something the system should do.
 */
export enum ActionID {
    /**
     * Does absolutely nothing.. making it the most useful action there is
     */
    nothing,
    modifyPixel,
    interval,
    timeout,
    atTime
}


export type _instruction = [ActionID, ...number[]];
export type instruction = interval | modifyPixel;

/**
 * Sets an interval. similar to setInterval(()=>{..}, n);
 * [1] -> the interval number,
 * [2..n] -> instructions to execute when the interval is to be executed
 */
export type interval = [ActionID.interval, number, instruction[]];
export type modifyPixel = [ActionID.modifyPixel, number, number[]];


/**
 * Represents all the actions you can take
 */
export type actions = interval | modifyPixel;

