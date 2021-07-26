/**
 * [imageWidth, imageHeight, MemoryAllocation]
 */
export type IDGHeader = [number, number, number];

export interface DecodedFile {
  imageWidth: number;
  imageHeight: number;
  memoryRequest: number;
  image: number[];
  memorySection: Uint8Array;
  stackSizeRequirement: number;
}
