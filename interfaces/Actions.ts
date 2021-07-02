import { U255 } from "./RGBA.ts";

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
export enum direction {
    topLeft, top, topRight,
    left, /** idx */ right,
    bottomLeft, bottom, bottomRight
}
/**
 * Something the system should do.
 */
export enum ActionID {
    // TODO: random pixel index -> stored to var
    // TODO: Persistance method -> dump the in-memory modifications to disk.
    // TODO: stop interval instruction

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
     * random number between 2.
     */
    randomNumber,

    /**
     * Stores the alpha value of a pixel in memory
     * [this#, indexFromMemory, pixelIndex, memoryKey]
     */
    storePixelOpacity,
    /** 
     * 
     * Brighter -> R+value , G+value B+value
     * Darker -> the above but minus (-)
     * [this#, index, value]
    */
    changePixelBrightness,
    /**
     * @fires changePixelBrightness for each pixel
     */
    changeImageBrightness,

    /**
     * Calls the actions repeatedly every time the timer runs out.. 
     * @param fromVar indicates wether the value in "n" is pointing to a variable or holds the value directly
     * [this#, fromVar, n, action[]]
     */
    interval,
    clearInterval,
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
    /**
     * Evaluate the actions for each pixel. index is stored in provided memory key
     * [this#, memoryKey, actions[]]
     */
    forEachPixel,
    coordinatesToIndex,
    

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
    ifNil,
    ifNotNil,
    ifInBounds,
    allTrue,

    /**
     * Gets the pixel index in a given direction and stores it.
     * [this#, isFromVar, direction, var, whereToStore]
     */
    getNeighboringPixel,

    /**
     * Now we're getting into polymorphic stuff
     */
    modifyInstruction,
    /**
     * Calls a debug in some form.
     */
    DEBUG

}

// TODO: same size instructions.
// TODO: turing complete instructions

export type _instruction = [ActionID, ...number[]];
export type memoryPointer = number;

/**
 * Sets an interval. similar to setInterval(()=>{..}, n);
 * [this#, intervalFromVar, interval, timerStorageKey, instructions[]]
 */
export type interval = [ActionID.interval, bool, number, number, instruction[]];
export type clearInterval = [ActionID.clearInterval, number];
export type modifyPixel = [ActionID.modifyPixel, bool, number, U255[]];
export type render = [ActionID.render];
export type storeValue = [ActionID.storeValue, bool, number, number];
export type forEachPixel = [ActionID.forEachPixel, number, instruction[]];
export type ifNotNil = [ActionID.ifNotNil, number, instruction[]];
/**
 * [this#, memoryKey, instructions[]]
 */
export type ifInBounds = [ActionID.ifInBounds, number, instruction[]];
export type getNeighboringPixel = [ActionID.getNeighboringPixel, bool, direction, number | memoryPointer, memoryPointer]
/**
 * [this#, indexFromMemory(0|1), pixelIndex, memoryKey]
 * */
export type storePixelOpacity = [ActionID.storePixelOpacity, bool, number, memoryPointer];
/** [this#, lhsIsVar, rhsIsVar, lhs, rhs, actions[], elseActions[]] */
export type ifEquals = [ActionID.ifEquals, bool,bool, number, number, instruction[], instruction[] | []];
/**
 * [this#, operation(enum), lhsIsVar, rhsIsVar, lhs, rhs, out(memoryPointer)]
 */
export type calculateAndStore = [ActionID.calculateAndStore, arithmetic, bool, bool, number, number, memoryPointer];
/**
 * [this#, lhsIsVar, rhsIsVar, min, max, out(memoryPointer)]
 */
export type randomNumber = [ActionID.randomNumber, bool, bool, number, number, memoryPointer];
/**
 * [this#, lhsIsVar, rhsIsVar, x, y, out(memoryPointer)]
 */
export type coordinatesToIndex = [ActionID.coordinatesToIndex, bool,bool,  number,number,  memoryPointer]
export type DEBUG = [ActionID.DEBUG, number];

/**
 * [this#, lhsIsVar, rhsIsVar, lhs, rhs, actions[]]
 */
export type ifGreaterThan = [ActionID.ifGreaterThan, bool, bool, number, number, instruction[]];
/**
 * [this#, lhsIsVar, rhsIsVar, lhs, rhs, actions[]]
 */
export type ifLessThan = [ActionID.ifLessThan, bool, bool, number, number, instruction[]];

/**
 * Does a bunch of comparisons, if all equal true then we run the instructions
 * [this#, comparisonsToDo, actionsToCall]
 */
export type allTrue = [ActionID.allTrue, comparison[], instruction[]];

/**
 * Identifies the action that check a certain action
 */
 export type comparison = ifEquals | ifGreaterThan | ifLessThan | ifNotNil | allTrue | ifInBounds;
/**
 * Represents all the actions you can take
 */
 export type instruction = interval | modifyPixel | render | storeValue | forEachPixel | ifNotNil | getNeighboringPixel | storePixelOpacity | ifEquals | calculateAndStore | ifGreaterThan | ifLessThan | DEBUG | allTrue | randomNumber | coordinatesToIndex | ifInBounds | clearInterval;