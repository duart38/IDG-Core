import { Instructions, RegisterKey } from "./Registers.ts";
import { InstructionParser, MemoryMapper } from "./Memory.ts";
import {
  indexByCoordinates,
} from "../utils/coordinates.ts";
import { ImageData } from "../interfaces/Image.ts";
import { combineRGB, spreadRGB } from "../utils/color.ts";
import { U255 } from "../interfaces/RGBA.ts";
import { DecodedFile } from "../interfaces/FileShape.ts";
import { sleep } from "../utils/timing.ts";
import { seeds } from "../utils/misc.ts";
import { executeMove, executeSignedMove } from "./Instructions/moving.ts";
import {
  addition,
  multiplication,
  subtraction,
} from "./Instructions/arithemetic.ts";
import { bitwiseAND, bitwiseOR, bitwiseShift } from "./Instructions/bitwise.ts";
import { callALocation, jumpBasedOnAcc } from "./Instructions/jump.ts";
import { randomToAccumulator } from "./Instructions/helper.ts";
import {
  modifyLuminosityIns,
  modifyPixel,
} from "./Instructions/pixelModification.ts";
import {
  fetchNeighboringPixel,
  fetchPixelColor,
  fetchPixelIndex,
} from "./Instructions/pixelRetrieval.ts";
import { RGBConversion } from "./Instructions/color.ts";
import { fetchImageInfo } from "./Instructions/imageInformation.ts";
import {
  drawBox,
  drawBoxManual,
  drawCircleA,
  drawLineP,
} from "./Instructions/shapes.ts";
import { RenderInstructionSet } from "../interfaces/RenderInstructionSet.ts";

const INSTRUCTION_LENGTH_IN_BYTES = 4;
//const PLANK = INSTRUCTION_LENGTH_IN_BYTES == 4 ? 0x7FFFFFFF : 0xffff;

export default class IDGVM extends InstructionParser {
  // Image specific stuff
  /**
   * Copy of the image to modify.
   */
  public imageCopy: number[];
  /** The image itself */
  public image: ImageData;
  private imageModificationStack: Array<Array<number>> = new Array();

  /**
   * Callback that is executed when a render request has been made
   */
  private imageRenderCB: (newImage: number[][]) => void;

  private IPStack: number[] = [];

  /**
   *
   * @param memory Refers to the allocated memory available to our system
   * @param interruptVectorAddress
   */
  constructor(
    memory: MemoryMapper,
    loadedFile: DecodedFile,
    interruptVectorAddress = 0x249F0,
  ) {
    super(memory, loadedFile, interruptVectorAddress);
    this.image = {
      imageData: loadedFile.image,
      width: loadedFile.imageWidth,
      height: loadedFile.imageHeight,
    };
    this.imageCopy = this.image.imageData.slice();
    this.imageRenderCB = () => {};
  }

  debug() {
    for (const name in this.registerMap) {
      try {
        // console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(8, '0')} -> ${this.getRegister(name)}`);
        console.log(
          `${name}: ${
            this.getRegister(name as RegisterKey).toString().padStart(3, "0")
          }`,
        );
      } catch (e) {
        console.error(
          "Potential empty stack (did you forget to add instructions?)",
          e,
        );
      }
    }
    console.log();
  }

  onImageRenderRequest(cb: (newImageData: number[][]) => void) {
    this.imageRenderCB = cb;
  }

  /**
   * Replace the active image with the image copy and then execute the callback method
   */
  private render() {
    this.image.imageData = this.imageCopy.slice();
    const t = this.imageModificationStack.splice(0); // TODO: could be made for efficient with us pre-calculating the amount of pushes before a render in the builder and including the size requirements in the header
    this.imageRenderCB(t);
  }

  viewMemoryAt(address: number, n = 8) {
    // 0x0f01: 0x04 0x05 0xA3 0xFE 0x13 0x0D 0x44 0x0F ...
    const nextNBytes = Array.from(
      { length: n },
      (_, i) => this.memory.getUint8(address + i),
    ).map((v) => v);

    console.log(
      `[${address}]: ${nextNBytes.join(" ")}`,
    );
  }

  handleInterupt(value: number) {
    const interruptBit = value % 0xf;
    console.log(`CPU Interrupt :: ${interruptBit}`);

    // If the interrupt is masked by the interrupt mask register
    // then do not enter the interrupt handler
    const isUnmasked = Boolean((1 << interruptBit) & this.getRegister("im"));
    if (!isUnmasked) { // not enabled
      return;
    }

    // Calculate where in the interupt vector we'll look
    const addressPointer = this.interruptVectorAddress +
      (interruptBit * INSTRUCTION_LENGTH_IN_BYTES);
    // Get the address from the interupt vector at that address
    const address = this.memory.getUint32(addressPointer);

    // We only save state when not already in an interupt
    if (!this.isInInterruptHandler) {
      // 0 = 0 args. This is just to maintain our calling convention
      // If this were a software defined interrupt, the caller is expected
      // to supply any required data in registers
      this.push(0);
      // Save the state
      this.pushState();
    }

    this.isInInterruptHandler = true;

    // Jump to the interupt handler
    this.setRegister("ip", address);
  }

  getPixelColor(n: number) {
    return this.image.imageData[n];
  }
  setPixelColor(n: number, value: number) {
    if (n >= 0 && n < this.imageCopy.length && this.image.imageData[n] !== value) {
      this.imageCopy[n] = value;
      this.imageModificationStack.push([RenderInstructionSet.MODIFY_PIXEL, n, value]); // TODO: outward-facing API
    }
  }
  pushIp() {
    this.IPStack.push(this.getRegister("ip"));
  }

  async execute(instruction: number[]) {
    // console.log(`$ Got instruction ${instruction}`)
    switch (instruction[0]) {
      /**
       * Return from an interupt
       */
      case Instructions.RET_INT: { // TODO: 32 bit check
        console.log("Return from interupt");
        this.isInInterruptHandler = false;
        this.popState();
        return;
      }

      case Instructions.INT: { // TODO: 32 bit check
        // We're only looking at the least significant nibble
        const interuptValue = instruction[1] & 0xf;
        this.handleInterupt(interuptValue);
        return;
      }

      case Instructions.MOVE:
        executeMove(this, instruction);
        break;
      case Instructions.MOVE_S: executeSignedMove(this, instruction); break;

        // Add a registers value to another registers value and puts the results in the accumulator

      case Instructions.ADD:
        addition(this, instruction);
        break;

      // Subtracts one thing from another based on the type of subtraction yielded

      case Instructions.SUBTRACT:
        subtraction(this, instruction);
        break;

      case Instructions.MULTIPLY:
        multiplication(this, instruction);
        break;

      // Increment value in register (puts result back in the same register)

      case Instructions.INC_REG: {
        const r1 = instruction[1];
        const r1v = this.registers.getUint32(r1);
        this.registers.setUint32(r1, r1v + 1);
        return;
      }

      // Decrement value in register (puts result back in the same register)

      case Instructions.DEC_REG: {
        const r1 = instruction[1];
        const oldValue = this.registers.getUint32(r1);
        this.registers.setUint32(r1, oldValue - 1);
        return;
      }
      case Instructions.BITWISE_SHIFT:
        bitwiseShift(this, instruction);
        break;

      /**
       * Bitwise AND
       */

      case Instructions.BITWISE_AND:
        bitwiseAND(this, instruction);
        break;

      // Or a registers value with a literal value and puts the results in the accumulator

      case Instructions.BITWISE_OR:
        bitwiseOR(this, instruction);
        break;

      // Bitwise-NOT a registers value and puts the result in the accumulator

      case Instructions.NOT: { // TODO: test this properly
        const r1 = instruction[1];
        const registerValue = this.registers.getUint32(r1);
        this.setRegister("acc", (~registerValue) & 0x7FFFFFFF);
        return;
      }

      case Instructions.JMP_ACC:
        jumpBasedOnAcc(this, instruction);
        break;

      case Instructions.GOTO: {
        const address = instruction[1];
        this.setRegister("ip", address);
        return;
      }

      // Push Literal to the stack

      case Instructions.PSH_LIT: {
        const value = instruction[1];
        this.push(value);
        return;
      }

      // Push Register

      case Instructions.PSH_REG: {
        const registerIndex = instruction[1];
        this.push(this.registers.getUint32(registerIndex));
        return;
      }

      /**
       * @deprecated
       */

      case Instructions.PSH_STATE: {
        this.pushState();
        return;
      }

      case Instructions.PSH_IP: {
        this.IPStack.push(this.getRegister("ip"));
        return;
      }
      case Instructions.PSH_IP_OFFSETTED: {
        this.IPStack.push(this.getRegister("ip") + instruction[1]);
        return;
      }

      // Pop

      case Instructions.POP: {
        const registerIndex = instruction[1];
        const value = this.IPStack.pop();
        if (!value) throw new Error("Pop called on an empty stack");
        this.registers.setUint32(registerIndex, value);
        return;
      }

      /**
       * Pushes the registry state to the stack and then calls the literal provided.
       * Using the return instruction you can return to the initial state
       * @see Instructions.RET for returning from this so-called sub-routine
       *  */

      case Instructions.CALL:
        callALocation(this, instruction);
        break;

      /**
       * Gets a random value based on a start and end value (inclusive) and stores this in the accumulator
       */

      case Instructions.RAND:
        randomToAccumulator(this, instruction);
        break;

      /**
       * Tells the VM not to execute a set of instructions. similar to jumping but here you can pass how
       * much to increment the Instruction Pointer by instead of having to provide a location on memory
       */

      case Instructions.SKIP: {
        const size = instruction[1];
        this.setRegister("ip", this.getRegister("ip") + size);
        return;
      }

      case Instructions.MODIFY_PIXEL_REG: {
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const color = this.getRegister("COL");
        const index = indexByCoordinates(x, y, this.image.width);
        this.setPixelColor(index, color);
        return;
      }
      case Instructions.MODIFY_PIXEL:
        modifyPixel(this, instruction);
        break;
      case Instructions.FETCH_PIXEL_NEIGHBOR:
        fetchNeighboringPixel(this, instruction);
        break;

      case Instructions.FETCH_PIXEL_COLOR_BY_INDEX:
        fetchPixelColor(this, instruction);
        break;

      case Instructions.FETCH_PIXEL_INDEX_BY_REG_COORDINATES: {
        const x = this.getRegister("x");
        const y = this.getRegister("y");
        const reg = instruction[1]; // where to store
        this.registers.setUint32(
          reg,
          indexByCoordinates(x, y, this.image.width),
        );
        return;
      }
      case Instructions.FETCH_PIXEL_INDEX:
        fetchPixelIndex(this, instruction);
        break;

      case Instructions.RGB_FROMREG_TO_COLOR: {
        const r = this.getRegister("R") as U255;
        const g = this.getRegister("G") as U255;
        const b = this.getRegister("B") as U255;
        this.setRegister("COL", combineRGB([r, g, b]));
        return;
      }

      case Instructions.RGB_TO_COLOR:
        RGBConversion(this, instruction);
        break;

      case Instructions.COLOR_FROMREG_TO_RGB: {
        const color = this.getRegister("COL");
        const [r, g, b] = spreadRGB(color);
        this.setRegister("R", r);
        this.setRegister("G", g);
        this.setRegister("B", b);
        return;
      }

      case Instructions.LANGTONS_ANT: {
        let currentX = this.getRegister("x");
        let currentY = this.getRegister("y");
        let direction = this.getRegister("r9"); // TODO: dedicated or something else
        const color1 = instruction[1]; // clock
        const color2 = instruction[2]; // anti-clock

        const thisIndex = indexByCoordinates(
          currentX,
          currentY,
          this.image.width,
        );

        const moveForward = (d: number) => {
          switch (d) {
            case 1: // 1 -> right
              currentX++;
              break;
            case 2: // 2 -> bottom
              currentY++;
              break;
            case 3: // 3  -> left
              currentX--;
              break;
            case 4: // 4 -> top
              currentY--;
              break;
          }
        };

        const saveBack = (dir: number, x: number, y: number) => {
          this.setRegister("r9", dir); // TODO: problematic...
          this.setRegister("x", x);
          this.setRegister("y", y);
        };

        if (color1 === this.image.imageData[thisIndex]) {
          // turn 90° clockwise,
          direction++;
          if (direction > 4) direction = 1;
          // flip the color of the square,
          this.setPixelColor(thisIndex, color2);
          // move forward one unit
          moveForward(direction);
          saveBack(direction, currentX, currentY);
        } else if (
          color2 ===
            this.image
              .imageData[
                indexByCoordinates(currentX, currentY, this.image.width)
              ]
        ) {
          // turn 90° counter-clockwise
          direction--;
          if (direction < 1) direction = 4;
          // flip the color of the square
          this.setPixelColor(thisIndex, color1);
          // move forward one unit
          moveForward(direction);
          saveBack(direction, currentX, currentY);
        }
        return;
      }

      case Instructions.SEEDS: {
        const onColor = instruction[1];
        const offColor = instruction[2];
        for (let i = 0; i < this.image.imageData.length; i++) {
          seeds(this, i, onColor, offColor);
        }
        return;
      }

      case Instructions.DRAW_BOX:
        drawBox(this, instruction);
        break;
      case Instructions.DRAW_BOX_MANUAL:
        drawBoxManual(this, instruction);
        break;
      case Instructions.DRAW_CIRCLE:
        drawCircleA(this, instruction);
        break;
      case Instructions.DRAW_LINE_POINTS:
        drawLineP(this, instruction);
        break;
      case Instructions.FETCH_IMAGE_INFO:
        fetchImageInfo(this, instruction);
        break;
      case Instructions.MODIFY_LUMINOSITY:
        modifyLuminosityIns(this, instruction);
        break;

      case Instructions.INTERVAL: {
        const time = instruction[1];
        const addressToCall = instruction[2];
        const intervalHandler = setInterval(() => {
          if (!this.halt) {
            this.pushState();
            this.setRegister("ip", addressToCall);
          }
        }, time);
        this.setRegister("r9", intervalHandler); // TODO: make a dedicated place for this

        return;
      }

      case Instructions.RENDER: {
        this.render();
        return;
      }

      // Return from subroutine

      case Instructions.RET: {
        const lastIP = this.IPStack.pop();
        if (!lastIP) throw new Error("Nowhere to return to");
        this.setRegister("ip", lastIP);
        return;
      }

      case Instructions.RET_TO_NEXT: {
        const lastIP = this.IPStack.pop();
        if (!lastIP) throw new Error("Nowhere to return to");
        this.setRegister("ip", lastIP + 1);
        return;
      }

      case Instructions.SLEEP: {
        const time = instruction[1];
        await sleep(time);
        return;
      }

      // Halt all computation

      case Instructions.HLT: {
        this.halt = true;
        return true;
      }
      case Instructions.DEBUG: {
        console.log(`####### DEBUG ${instruction[1]} ##################`);
        this.debug();
        console.log(`####### END DEBUG ${instruction[1]}  ##############`);
        return;
      }
      case 0: {
        return;
      }
      default:
        console.error(
          `instruction ${
            instruction[0]
          } is not an executable instruction, make sure your instructions are aligned properly by padding the values that are too small for a complete instruction.`,
          instruction,
        );
    }
  }

  async run() {
    for (const inst of this.fetch()) {
      const htl = await this.execute(inst);
      if (htl || this.halt) return;
    }
  }
}
