
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
        The easiest way is to multiply each of the R,G,B values by some constant
        if the constant is >1 it will make it brighter, and if <1 it will be darker.
       
        If you're making it brighter then you must test each value to make sure it doesn't
        go over the maximum (usually 255).
    */
    changeBrightness,

    interval,
    timeout,
    atTime,
    /**
     * newR = alpha - oldR
     * newG = alpha - oldG
     * newB = alpha - oldB
     * 
     * [this#, index]
     */
    invertPixel,
    

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
    $storeImageMatrix,
    /**
     * Loads the image matrix from the variable list and populates the displayed image
     * [this#, locationString, offsetX, offsetY]
     */
    $loadImageMatrix,
    /**
     * Stores (or replaces) a value in the list of variables.
     * [this#, locationString, valueAsNumber]
     */
    $storeValue,
    /**
     * Takes a set of coordinates and stores them in memory as an array of indexes.
     * Stored value can be used to do batch operations on a set of coordinates
     * [this#, ...number[]]
     */
    $groupPixels,
    /**
     * [this#, variableKey]
     */
    $invertGroup,
    /**
     * Moves the coordinates stored in the variable by the offsets given in the instruction..
     * If the value is negative it moves backwards, if positive it moves forward, i.e:
     *  if x < 0 then move to the left ..
     * [this#, variableKey, offsetX, offsetY]
     * 
     * @fires ActionID.render instruction after all has been updated
     */
    $moveGroup,
    $changeGroupOpacity,
    /**
     * Adds 2 colors together, takes the index to modify and the variable which contains the image data
     * [this#, index, variableKey]
     */
    $addToPixel,
    $addToGroup,
    /**
     * Checks if the given value is equals to the stored value, if so we call an action
     */
    $ifEquals,
    /**
     * Checks if 2 vars are equal, if so we call an action
     */
    $ifVarsEqual,

    /**
     * @todo try and see if we can write more instructions in this manner as it reduces the number of instructions we need
     * Does some calculation on provided numbers or numbers stored
     * if lhsIsVar == 1 -> then indicates a stored value so the value that is passed in lhs in this case is a key for the variables
     * if rhsIsVar == 1 -> in this case the right hand side is a variable instead of the number itself.
     * if any of the 2 or both are 0 then it means multiply directly
     * ..
     * out is the variable to store to
     * [this#, lhsIsVar, rhsIsVar, lhs, rhs, out]
     */
    $calculateAndStore

}


export type _instruction = [ActionID, ...number[]];


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
 export type instruction = interval | modifyPixel;