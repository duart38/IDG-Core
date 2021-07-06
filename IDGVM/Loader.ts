/**
 * Should take in a .idg image and figure out based on the headers how allocation should be
 * done.. when this is done we can call the CPU. think of this as a "usb port" of sorts.
 * 
 * i'm making this in a modular way because there could be a case where we load directly
 * from for example a memory stick (exhibition mode) or from a network signal (event mode)
 */

import { gunzip } from "https://deno.land/x/compress@v0.3.8/mod.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";


export default class IDGLoader {
    private vm: IDGVM;
    private memoryMapper: MemoryMapper;
    private memory: DataView;
    constructor(rawFileData: Uint8Array){
        const decompressed = gunzip(rawFileData);
        const x = new DataView(decompressed.buffer);
        const imageWidth = x.getUint32(0);
        const imageHeight = x.getUint32(4);
        const memorySizeRequest = x.getUint32(8);
        const image: number[] = [];
        for(let i = 12; i < ((imageWidth * imageHeight) * 4) + 9; i += 4){
            image.push(x.getUint32(i));
        }

        this.memoryMapper = new MemoryMapper();
        this.memory = createMemory(memorySizeRequest);
        this.memoryMapper.map(this.memory, 0, memorySizeRequest);


        this.vm = new IDGVM(this.memoryMapper, {imageData: image, width: imageWidth, height: imageHeight});
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