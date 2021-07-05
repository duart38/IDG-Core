// const eraseScreen = () => {
//     console.log('\x1b[2J');
//   }

import { MemoryMapper } from "../Memory.ts";

//   const moveTo = (x: number, y: number) => {
//     console.log(`\x1b[${y};${x}H`);
//   }

//   const setBold = () => {
//     console.log('\x1b[1m');
//   }

//   const setRegular = () => {
//     console.log('\x1b[0m');
//   }



/**
 * Image display holds its own image memory and takes instructions from the virtual machine to cary out
 * certain actions.
 * actions are things like modifying a pixel, drawing shapes and triggering a method that calls
 * all display listeners (display listeners are just functions that are called back when the image is updated)
 */
export class ImageDisplay {
  private memoryMapper: MemoryMapper;
  private image: number[];
  /**
   * 8 * 4 to represent 32 bit instructions. multiplication after that represents the
   * amount of 32-bit instructions that can fit into the memory that is to be mapped by the construction of this display.
   * 
   * 5 slots means: 
   *    [8BitNum, 8BitNum, 8BitNum, 8BitNum] * 5
   * or if you prefer to read it as 32 bits: 
   *    [32BitNum, 32BitNum, 32BitNum, 32BitNum, 32BitNum]
   */
  private instructionMemorySize = (8 * 4) * 5;
  /**
   * @param memoryView dataview used to map a certain section in memory to put the commands in
   * @param width width of image in pixels
   * @param height height of image in pixels
   */
  constructor(memoryMapper: MemoryMapper, width: number, height: number, imageData: number[]){
    this.image = imageData;
    this.memoryMapper = memoryMapper;

    const x = 0x7FFFFFFF - this.instructionMemorySize; // very last of memory
    this.memoryMapper.map(this.createImageMulticast() as unknown as any, x, 0x7FFFFFFF); // very last place of memory
  }

  /**
   * to trigger the instruction that was constructed for this interface call (getUint8) on any part of the mapped memory
   * 
   * @returns 
   */
  private createImageMulticast(){
    return {
      getUint16: () => 0,
      getUint8: () => {
        // TODO: execute instruction for display
      },
      setUint16: () => 0,
      // Triggered when something in the overlapping memory of this I/O is set
      setUint32: (address: number, data: number) => {
        // TODO: .. depending on the section of the address, get the values and store them in this class for execution later
        console.log(`Image data has been updated at address: ${address}, with data: ${data}`);
      },
    };
  };
}
