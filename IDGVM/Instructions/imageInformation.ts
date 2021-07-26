import IDGVM from "../Machine.ts";

export enum ImageInfoFetchType {
  IMAGE_WIDTH_REG,
  IMAGE_WIDTH_MEM,
  IMAGE_HEIGHT_REG,
  IMAGE_HEIGHT_MEM,
  IMAGE_TOTAL_PIXELS_REG,
  IMAGE_TOTAL_PIXELS_MEM,
}

export function fetchImageInfo(_this: IDGVM, params: number[]) {
  switch (params[1]) {
    case ImageInfoFetchType.IMAGE_WIDTH_REG: {
      const regToStoreIn = params[2];
      _this.setRegisterAt(regToStoreIn, _this.image.width);
      break;
    }
    case ImageInfoFetchType.IMAGE_WIDTH_MEM: {
      const memToStoreIn = params[2];
      _this.setMemoryAt(memToStoreIn, _this.image.width);
      break;
    }
    case ImageInfoFetchType.IMAGE_HEIGHT_REG: {
      const regToStoreIn = params[2];
      _this.setRegisterAt(regToStoreIn, _this.image.height);
      break;
    }
    case ImageInfoFetchType.IMAGE_HEIGHT_MEM: {
      const memToStoreIn = params[2];
      _this.setMemoryAt(memToStoreIn, _this.image.height);
      break;
    }
    case ImageInfoFetchType.IMAGE_TOTAL_PIXELS_REG: {
      const regToStoreIn = params[2];
      _this.setRegisterAt(regToStoreIn, _this.image.width * _this.image.height);
      break;
    }
    case ImageInfoFetchType.IMAGE_TOTAL_PIXELS_MEM: {
      const memToStoreIn = params[2];
      _this.setMemoryAt(memToStoreIn, _this.image.width * _this.image.height);
      break;
    }
  }
}
