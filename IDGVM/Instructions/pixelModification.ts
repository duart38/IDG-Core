import { modifyLuminosity } from "../../utils/color.ts";
import { indexByCoordinates } from "../../utils/coordinates.ts";
import IDGVM from "../Machine.ts";

export enum PixelModificationType {
  MODIFY_PIXEL_REG_REG_REG,
  MODIFY_PIXEL_LIT_LIT_LIT,
  MODIFY_PIXEL_MEM_MEM_MEM,
  // TODO: all the possible combinations of the above
}
export enum LuminosityModificationType {
  MODIFY_PIXEL_LUMINOSITY_REG,
  MODIFY_PIXEL_LUMINOSITY_MEM,
  MODIFY_PIXEL_LUMINOSITY_LIT,

  MODIFY_IMAGE_LUMINOSITY_REG,
  MODIFY_IMAGE_LUMINOSITY_MEM,
  MODIFY_IMAGE_LUMINOSITY_LIT,
}

export function modifyPixel(_this: IDGVM, params: number[]) {
  switch (params[1]) {
    case PixelModificationType.MODIFY_PIXEL_REG_REG_REG: {
      const x = _this.getRegisterAt(params[2]); // first reg
      const y = _this.getRegisterAt(params[3]); // second reg
      const color = _this.getRegisterAt(params[4]); // third reg
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(index, color);
      break;
    }
    case PixelModificationType.MODIFY_PIXEL_LIT_LIT_LIT: {
      const x = params[2]; // first literal
      const y = params[3]; // second literal
      const color = params[4]; // third literal
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(index, color);
      break;
    }
    case PixelModificationType.MODIFY_PIXEL_MEM_MEM_MEM: {
      const x = _this.getMemoryAt(params[2]); // first mem
      const y = _this.getMemoryAt(params[3]); // second mem
      const color = _this.getMemoryAt(params[4]); // third mem
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(index, color);
      break;
    }
  }
}

export function modifyLuminosityIns(_this: IDGVM, params: number[]) {
  switch (params[1]) {
    case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_REG: {
      const luminosity = _this.getRegisterAt(params[2]);
      const x = _this.getRegister("x");
      const y = _this.getRegister("y");
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(
        index,
        modifyLuminosity(luminosity, _this.getPixelColor(index)),
      );
      break;
    }
    case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_MEM: {
      const luminosity = _this.getMemoryAt(params[2]);
      const x = _this.getRegister("x");
      const y = _this.getRegister("y");
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(
        index,
        modifyLuminosity(luminosity, _this.getPixelColor(index)),
      );
      break;
    }
    case LuminosityModificationType.MODIFY_PIXEL_LUMINOSITY_LIT: {
      const luminosity = params[2];
      const x = _this.getRegister("x");
      const y = _this.getRegister("y");
      const index = indexByCoordinates(x, y, _this.image.width);
      _this.setPixelColor(
        index,
        modifyLuminosity(luminosity, _this.getPixelColor(index)),
      );
      break;
    }
    case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_REG: {
      const luminosity = _this.getRegisterAt(params[2]);
      for (let i = 0; i < _this.imageCopy.length; i++) {
        _this.setPixelColor(
          i,
          modifyLuminosity(luminosity, _this.getPixelColor(i)),
        );
      }
      break;
    }
    case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_MEM: {
      const luminosity = _this.getMemoryAt(params[2]);
      for (let i = 0; i < _this.imageCopy.length; i++) {
        _this.setPixelColor(
          i,
          modifyLuminosity(luminosity, _this.getPixelColor(i)),
        );
      }
      break;
    }
    case LuminosityModificationType.MODIFY_IMAGE_LUMINOSITY_LIT: {
      const luminosity = params[2];
      for (let i = 0; i < _this.imageCopy.length; i++) {
        _this.setPixelColor(
          i,
          modifyLuminosity(luminosity, _this.getPixelColor(i)),
        );
      }
      break;
    }
  }
}
