/**
 * Should take in a .idg image and figure out based on the headers how allocation should be
 * done.. when this is done we can call the CPU. think of this as a "usb port" of sorts.
 * 
 * i'm making this in a modular way because there could be a case where we load directly
 * from for example a memory stick (exhibition mode) or from a network signal (event mode)
 */

import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";


export default class IDGLoader {
    private vm: IDGVM;
    private memoryMapper: MemoryMapper;
    private memory: DataView;
    constructor(rawFileData: Uint8Array){
        const x = new DataView(rawFileData);
        const imageWidth = x.getUint32(0);
        const imageHeight = x.getUint32(1);
        const memorySizeRequest = x.getUint32(2);
        const image = new Uint32Array(x.buffer.slice(3, (imageWidth * imageHeight) * 4)); // end of header till end of image


        this.memoryMapper = new MemoryMapper();
        this.memory = createMemory(memorySizeRequest);
        this.memoryMapper.map(this.memory, 0, memorySizeRequest);


        this.vm = new IDGVM(this.memoryMapper, {imageData: Array.from(image), width: imageWidth, height: imageHeight});
    }

    onImageUpdate(cb: (dat: number[])=>void){
        this.vm.onImageRenderRequest(cb);
    }

    startVM(){
        this.vm.run();
    }
    stopVM(){
        this.vm.execute(Instructions.HLT);
    }
}

 //const decompressed = gunzip(compressed);