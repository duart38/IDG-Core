import { drawLine, indexByCoordinates } from "../../utils/coordinates.ts";
import IDGVM from "../Machine.ts";

export enum RectangleDrawingType {
    /** Draw a box with the width and the height coming from literal values and the x,y, color coming from the register */
    DRAW_BOX_WLIT_HLIT,
    /** Draw a box with the width and the height coming from the supplied register addresses values and the x,y, color coming from the register */
    DRAW_BOX_WREG_HREG,
}
/**
 * Draws a rectangle with the specified width, height, x and y coordinates and color. (all supplied)
 * Order: x,y, width, height, color
 * **/
export enum ManualRectangleDrawingType {
    DRAW_BOX_LIT_LIT_LIT_LIT_LIT,
}
export enum DrawLineType {
    DRAW_LINE_P1REG_P2REG,
    DRAW_LINE_P1LIT_P2LIT,
}
export enum DrawCircleType {
    DRAW_CIRCLE_LIT,
    DRAW_CIRCLE_REG,
    DRAW_CIRCLE_MEM
}

export function drawBox(_this: IDGVM, params: number[]){
    const color = _this.getRegister("COL");
    const x = _this.getRegister("x");
    const y = _this.getRegister("y");
    const imageWidth = _this.image.width;
    const imageHeight = _this.image.height;
    switch(params[1]){
        case RectangleDrawingType.DRAW_BOX_WLIT_HLIT: {
            const width = params[2]; // supplied
            const height = params[3]; // supplied
              for (let tY = 0; tY <= height; tY++) {
                for (let tX = 0; tX <= width; tX++) {
                  const nX = tX + x; const nY = tY + y;
                  if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) continue;
                  _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color); //this.imageCopy[indexByCoordinates(nX, nY, imageWidth)] = color;
                }
            }
            break;
        }
        case RectangleDrawingType.DRAW_BOX_WREG_HREG: {
            const width = _this.getRegisterAt(params[2]); // supplied
            const height = _this.getRegisterAt(params[3]); // supplied
            for (let tY = 0; tY <= height; tY++) {
                for (let tX = 0; tX <= width; tX++) {
                  const nX = tX + x; const nY = tY + y;
                  if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) continue;
                  _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color);
                }
            }
        }
    }
}

export function drawBoxManual(_this: IDGVM, params: number[]){
    const imageWidth = _this.image.width;
    const imageHeight = _this.image.height;
    switch(params[1]){
        case ManualRectangleDrawingType.DRAW_BOX_LIT_LIT_LIT_LIT_LIT: {
            const x = params[2];
            const y = params[3];

            const width = params[4]; // supplied
            const height = params[5]; // supplied

            const color = params[6]; 
              for (let tY = 0; tY <= height; tY++) {
                for (let tX = 0; tX <= width; tX++) {
                  const nX = tX + x; const nY = tY + y;
                  if (Math.min(nX, nY) < 1 || nX > imageWidth || nY > imageHeight) continue;
                  _this.setPixelColor(indexByCoordinates(nX, nY, imageWidth), color); //this.imageCopy[indexByCoordinates(nX, nY, imageWidth)] = color;
                }
            }
            break;
        }
    }
}

export function drawLineP(_this: IDGVM, params: number[]){
    switch(params[1]){
        case DrawLineType.DRAW_LINE_P1REG_P2REG: {
            const point1_x = _this.getRegisterAt(params[2]);
            const point1_y = _this.getRegisterAt(params[3]);
    
            const point2_x = _this.getMemoryAt(params[4]);
            const point2_y = _this.getMemoryAt(params[5]);
            drawLine(_this, point1_x,point1_y,   point2_x,point2_y);
            break;
        }
        case DrawLineType.DRAW_LINE_P1LIT_P2LIT: {
            const point1_x = params[2];
            const point1_y = params[3];

            const point2_x = params[4];
            const point2_y = params[5];
            drawLine(_this, point1_x,point1_y,   point2_x,point2_y);
            break;
        }
    }
}

export function drawCircleA(_this: IDGVM, params: number[]){
    const imageHeight = _this.image.height;
    const imageWidth = _this.image.width;
    switch(params[1]){
        case DrawCircleType.DRAW_CIRCLE_LIT: {
            const color = _this.getRegister("COL");

            const x = _this.getRegister("x");
            const y = _this.getRegister("y");
    
            const radius = params[2]; // supplied
    
            const radSquared = radius ** 2;
            for (let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++) {
                for (let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++) {
                    if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color) // this.imageCopy[indexByCoordinates(currentX, currentY, imageWidth)] = color;
                }
            }
            break;
        }
        case DrawCircleType.DRAW_CIRCLE_REG: {
            const color = _this.getRegister("COL");
            const x = _this.getRegister("x");
            const y = _this.getRegister("y");

            const radius = _this.getRegisterAt(params[2]); // supplied
            const radSquared = radius ** 2;
            for (let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++) {
                for (let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++) {
                    if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color) // this.imageCopy[indexByCoordinates(currentX, currentY, imageWidth)] = color;
                }
            }
            break;
        }
        case DrawCircleType.DRAW_CIRCLE_MEM: {
            const color = _this.getRegister("COL");
            const x = _this.getRegister("x");
            const y = _this.getRegister("y");

            const radius = _this.getMemoryAt(params[2]); // supplied
            const radSquared = radius ** 2;
            for (let currentY = Math.max(1, y - radius); currentY <= Math.min(y + radius, imageHeight); currentY++) {
                for (let currentX = Math.max(1, x - radius); currentX <= Math.min(x + radius, imageWidth); currentX++) {
                    if ((currentX - x) ** 2 + (currentY - y) ** 2 < radSquared) _this.setPixelColor(indexByCoordinates(currentX, currentY, imageWidth), color) // this.imageCopy[indexByCoordinates(currentX, currentY, imageWidth)] = color;
                }
            }
            break;
        }
    }
}
