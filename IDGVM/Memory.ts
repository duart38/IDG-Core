export const createMemory = (sizeInBytes: number) => {
    const ab = new ArrayBuffer(sizeInBytes);
    const dv = new DataView(ab);
    return dv;
};

export class MemoryMapper {
    private regions: any; // TODO: change me
    constructor() {
      this.regions = [];
    }
  
    map(device: DataView, start: number, end: number, remap = true) {
      const region = {
        device,
        start,
        end,
        remap
      };
      this.regions.unshift(region);
  
      return () => {
        this.regions = this.regions.filter((x: { device: DataView; start: number; end: number; remap: boolean; }) => x !== region);
      };
    }
  
    findRegion(address: number) {
      let region = this.regions.find((r: { start: number; end: number; }) => address >= r.start && address <= r.end);
      if (!region) {
        throw new Error(`No memory region found for address ${address}`);
      }
      return region;
    }
  
    getUint16(address: number): number {
      const region = this.findRegion(address);
      const finalAddress = region.remap
        ? address - region.start
        : address;
      return region.device.getUint16(finalAddress);
    }
  
    getUint8(address: number): number {
      const region = this.findRegion(address);
      const finalAddress = region.remap
        ? address - region.start
        : address;
      return region.device.getUint8(finalAddress);
    }
  
    setUint16(address: number, value: number): number {
      const region = this.findRegion(address);
      const finalAddress = region.remap
        ? address - region.start
        : address;
      return region.device.setUint16(finalAddress, value);
    }
  
    setUint8(address: number, value: number): number {
      const region = this.findRegion(address);
      const finalAddress = region.remap
        ? address - region.start
        : address;
      return region.device.setUint8(finalAddress, value);
    }
  
    load(startAddress: number, data: number[]) {
      data.forEach((byte, offset) => this.setUint8(startAddress + offset, byte));
    }
}