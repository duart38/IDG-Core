/**
 * Since JSON supports true and false but we don't want to store it as such..
 */
export type bool = 0 | 1;
export enum arithmetic {
 ADDITION, SUBTRACTION, DIVISION, MULTIPLICATION,
 BITSHIFT_LEFT, BITSIGNEDSHIFT_RIGHT, BITSHIFT_RIGHT, BIT_AND, BIT_OR, BIT_XOR, BIT_NOT
}
/**
 * Something the system should do.
 */
export enum ActionID {
    /**
     * Does absolutely nothing.. making it the most useful action there is
     */
    nothing,
    /**
     * Forces re-rendering
     */
    render,
    modifyPixel,
    changePixelOpacity,
    /** 
     * 
     * Brighter -> R+value , G+value B+value
     * Darker -> the above but minus (-)
     * [this#, value]
    */
    changeImageBrightness,

    interval,
    /**
     * Calls the actions after the timer runs out.. 
     * @param fromVar indicates wether the value in "n" is pointing to a variable or holds the value directly
     * [this#, fromVar, n, action[]]
     */
    timeout,
    atTime,
    /**
     * newR = 255 - oldR
     * newG = 255 - oldG
     * newB = 255 - oldB
     * 
     * [this#, isVariable, index]
     */
    invertPixel,
    /**
     * Inverts every pixel
     * [this#]
     */
    invertImage,
    

    //////////////////////////////////////////////////////////////////////////
    //                                                                      //
    //               Methods that use or manipulate variables               //
    //                                                                      //
    //////////////////////////////////////////////////////////////////////////

    /**
     * Store an image matrix from a network location in a variable. 
     * !! This should be done beforehand and stored in json !!
     * [this#, locationString, urlString]
     */
    storeImageMatrix,
    /**
     * Loads the image matrix from the variable list and populates the displayed image
     * [this#, locationString, offsetX, offsetY]
     */
    loadImageMatrix,
    /**
     * Stores (or replaces) a value in the list of variables.
     * @param rhsIsVar indicates if the value is another stored variable or if we need to store the one the user just provided
     * @todo make sure that value here is a key to a variable or (number | number[])
     * [this#, rhsIsVar, locationString, value]
     */
    storeValue,
    /**
     * Takes a set of coordinates and stores them in memory as an array of indexes.
     * Stored value can be used to do batch operations on a set of coordinates
     * [this#, ...number[]]
     */
    groupPixels,
    /**
     * [this#, variableKey]
     * @fires ActionID.render instruction after all has been updated
     */
    invertGroup,
    /**
     * Moves the coordinates stored in the variable by the offsets given in the instruction..
     * If the value is negative it moves backwards, if positive it moves forward, i.e:
     *  if x < 0 then move to the left ..
     * [this#, variableKey, offsetX, offsetY]
     * 
     * @fires ActionID.render instruction after all has been updated
     */
    moveGroup,
    changeGroupOpacity,
    /**
     * Adds 2 colors together, takes the index to modify and the variable which contains the image data
     * [this#, index, variableKey]
     */
    addToPixel,
    addToGroup,
    /**
     * Checks if 2 things are the same, if so call an action
     * [this#, lhsIsVar, rhsIsVar, lhs, rhs, action]
     */
    ifEquals,
    /**
     * Checks if 2 things are not the same, if so call an action
     * [this#, lhsIsVar, rhsIsVar, lhs, rhs, action]
     */
    ifNotEquals,
    ifGreaterThan,
    ifLessThan,
    

    /**
     * @todo try and see if we can write more instructions in this manner as it reduces the number of instructions we need
     * Does some calculation on provided numbers or numbers stored
     * if lhsIsVar == 1 -> then indicates a stored value so the value that is passed in lhs in this case is a key for the variables
     * if rhsIsVar == 1 -> in this case the right hand side is a variable instead of the number itself.
     * if any of the 2 or both are 0 then it means multiply directly
     * ..
     * out is the variable to store to
     * [this#, operation(enum), lhsIsVar, rhsIsVar, lhs, rhs, out]
     */
    calculateAndStore,
    /**
     * Do action if null
     */
    ifNull,
    ifNotNull

}


export type _instruction = [ActionID, ...number[]];


/**
 * Sets an interval. similar to setInterval(()=>{..}, n);
 * [1] -> the interval number,
 * [2..n] -> instructions to execute when the interval is to be executed
 */
export type interval = [ActionID.interval, number, instruction[]]; // TODO: change these
export type modifyPixel = [ActionID.modifyPixel, number, number[]];


/**
 * Represents all the actions you can take
 */
 export type instruction = interval | modifyPixel;