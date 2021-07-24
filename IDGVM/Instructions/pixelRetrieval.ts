import { Direction } from "../../interfaces/Actions.ts";
import { getNeighboringPixelIndex, indexByCoordinates } from "../../utils/coordinates.ts";
import IDGVM from "../Machine.ts";

export enum NeighborRetrievalType {
    NEIGHBORING_PIXEL_INDEX_TO_REG,
    NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG
}

export enum PixelColorByIndexType {
    FETCH_PIXEL_COLOR_REG,
    FETCH_PIXEL_COLOR_MEM,
    FETCH_PIXEL_COLOR_LIT
}
export enum PixelIndexFetchType {
    FETCH_PIXEL_INDEX_REG_REG,
    FETCH_PIXEL_INDEX_LIT_LIT,
    FETCH_PIXEL_INDEX_MEM_MEM,
}

/**
 * @param params [instr, type, index, storageLocation]
 * */
export function fetchPixelColor(_this: IDGVM, params: number[]){
    switch(params[1]){
        case PixelColorByIndexType.FETCH_PIXEL_COLOR_LIT: {
            const pixelIndex = params[2]; // where to check from
            const storageLocation = params[3]; // where to store the color
            _this.setRegisterAt(storageLocation, _this.getPixelColor(pixelIndex))
            break;
        }
        case PixelColorByIndexType.FETCH_PIXEL_COLOR_REG: {
            const pixelIndex = params[2]; // where to check from
            const storageLocation = params[3]; // where to store the color
            _this.setRegisterAt(storageLocation, _this.getPixelColor(_this.getRegisterAt(pixelIndex)))
            break;
        }
        case PixelColorByIndexType.FETCH_PIXEL_COLOR_MEM: {
            const pixelIndex = params[2]; // where to check from
            const storageLocation = params[3]; // where to store the color
            _this.setRegisterAt(storageLocation, _this.getPixelColor(_this.getMemoryAt(pixelIndex)));
            break;
        }
    }
}

export function fetchNeighboringPixel(_this: IDGVM, params: number[]){
    const direction = params[2] as unknown as Direction; // U255
    switch(params[1]){
        case NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_TO_REG: {
            const currentPixel = params[3]; // where to check from
            const reg = params[4]; // where (reg) to put it
            const idx = getNeighboringPixelIndex(direction, currentPixel, _this.image.width);
            _this.setRegisterAt(reg, idx);
            return;
          }
          case NeighborRetrievalType.NEIGHBORING_PIXEL_INDEX_FROM_REG_TO_REG: {
            const currentPixel = _this.getRegisterAt(params[3]); // which register holds the current pixel
            const reg = params[4]; // which register to put it in
            const idx = getNeighboringPixelIndex(direction, currentPixel, _this.image.width);
            _this.setRegisterAt(reg, idx);
            return;
          }
    }
}

export function fetchPixelIndex(_this: IDGVM, params: number[]){
    switch(params[1]){
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_REG_REG: {
            const x = _this.getRegisterAt(params[2]);
            const y = _this.getRegisterAt(params[3]);
            const reg = params[4]; // where to store
            _this.setRegisterAt(reg, indexByCoordinates(x,y, _this.image.width));
            break;
        }
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_LIT_LIT: {
            const x = params[2];
            const y = params[3];
            const reg = params[4]; // where to store
            _this.setRegisterAt(reg, indexByCoordinates(x,y, _this.image.width));
            break;
        }
        case PixelIndexFetchType.FETCH_PIXEL_INDEX_MEM_MEM: {
            const x = _this.getMemoryAt(params[2]);
            const y = _this.getMemoryAt(params[3]);
            const reg = params[4]; // where to store
            _this.setRegisterAt(reg, indexByCoordinates(x,y, _this.image.width));
            break;
        }
    }
}