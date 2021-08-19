import IDGVM from "../IDGVM/Machine.ts";
import { Direction } from "../interfaces/Actions.ts";
import { getNeighboringPixelIndex, indexByCoordinates } from "./coordinates.ts";

// TODO: make a way to apply any rule provided to the image..
export function rule184(
  machine: IDGVM,
  zeroColor: number,
  oneColor: number,
  idx?: number,
) {
  let currentIDX: number;
  if (!idx) {
    const currentX = machine.getRegister("x");
    const currentY = machine.getRegister("y");
    currentIDX = indexByCoordinates(currentX, currentY, machine.image.width);
  } else {
    currentIDX = idx;
  }
  const left = getNeighboringPixelIndex(
    Direction.left,
    currentIDX,
    machine.image.width,
  );
  const right = getNeighboringPixelIndex(
    Direction.right,
    currentIDX,
    machine.image.width,
  );

  const leftColor = machine.image.imageData[left];
  const centerColor = machine.image.imageData[currentIDX];
  const rightColor = machine.image.imageData[right];

  /**
     * Color to bit
     */
  const CTB = (col: number): number => {
    if (col === zeroColor) return 0;
    else if (col === oneColor) return 1;
    return -1;
  };

  const currentMap = [CTB(leftColor), CTB(centerColor), CTB(rightColor)]
    .toString();
  if (currentMap === [1, 1, 1].toString())return zeroColor;
  else if (currentMap === [1, 1, 0].toString())return zeroColor;
  else if (currentMap === [1, 0, 1].toString())return zeroColor;
  else if (currentMap === [1, 0, 0].toString())return oneColor;
  else if (currentMap === [0, 1, 1].toString())return oneColor;
  else if (currentMap === [0, 1, 0].toString())return oneColor;
  else if (currentMap === [0, 0, 1].toString())return oneColor;
  else if (currentMap === [0, 0, 0].toString())return zeroColor;

  return machine.image.imageData[currentIDX];
}

/**
 * Seeds cellular automation calculation on a given pixel. returns the color to replace by
 */
export function seeds(
  _this: IDGVM,
  index: number,
  liveColor: number,
  deadColor: number,
) {
  const currentColor = _this.getPixelColor(index);
  /*
    In each time step, a cell turns on  if it was off but had exactly two neighbors that were on;
    all other cells turn off.
    */
  const color = (idx: number) => {
    return _this.getPixelColor(idx);
  };

  if (currentColor === deadColor) { // if it was off
    const topLeft = color(
      getNeighboringPixelIndex(Direction.topLeft, index, _this.image.width),
    );
    const top = color(
      getNeighboringPixelIndex(Direction.top, index, _this.image.width),
    );
    const topRight = color(
      getNeighboringPixelIndex(Direction.topRight, index, _this.image.width),
    );

    const left = color(
      getNeighboringPixelIndex(Direction.left, index, _this.image.width),
    );
    const right = color(
      getNeighboringPixelIndex(Direction.right, index, _this.image.width),
    );

    const bottomLeft = color(
      getNeighboringPixelIndex(Direction.bottomLeft, index, _this.image.width),
    );
    const bottom = color(
      getNeighboringPixelIndex(Direction.bottom, index, _this.image.width),
    );
    const bottomRight = color(
      getNeighboringPixelIndex(Direction.bottomRight, index, _this.image.width),
    );

    const onNeighbors = [
      topLeft,
      top,
      topRight,
      left,
      right,
      bottomLeft,
      bottom,
      bottomRight,
    ]
      .reduce((prev, curr) => {
        prev += curr === liveColor ? 1 : 0;
        return prev;
      }, 0);
    // if it had exactly 2 neighbors that are on
    if (onNeighbors === 2) {
      _this.setPixelColor(index, liveColor);
    } else {
      _this.setPixelColor(index, deadColor);
    }
  } else {
    _this.setPixelColor(index, deadColor);
  }
}
