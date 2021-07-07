/**
 * Should take in a .idg image and figure out based on the headers how allocation should be
 * done.. when this is done we can call the CPU. think of this as a "usb port" of sorts.
 * 
 * i'm making this in a modular way because there could be a case where we load directly
 * from for example a memory stick (exhibition mode) or from a network signal (event mode)
 */

import { deCompress } from "../utils/bits.ts";
import { spreadImage } from "../utils/color.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";


export default class IDGLoader {
    private vm: IDGVM;
    private memoryMapper: MemoryMapper;
    constructor(rawFileData: Uint8Array, autoStart = false){
        const decompressed = deCompress(rawFileData);
        const x = new DataView(decompressed.buffer);
        const imageWidth = x.getUint32(0);
        const imageHeight = x.getUint32(4);
        const memorySizeRequest = x.getUint32(8);
        console.log(memorySizeRequest)
        const image: number[] = [];
        let i = 12;
        for(;i < ((imageWidth * imageHeight) * 4) + 9; i += 4){
            image.push(x.getUint32(i));
        }

        this.memoryMapper = new MemoryMapper();

        const memory = createMemory(memorySizeRequest);
        this.memoryMapper.map(memory, 0, memory.byteLength);
        const memorySection = decompressed.slice(i,  i + memorySizeRequest);
        const writableBytes = new Uint8Array(memory.buffer);
        writableBytes.set(memorySection);

        this.vm = new IDGVM(this.memoryMapper, memory.byteLength, {imageData: image, width: imageWidth, height: imageHeight});
        if(autoStart) this.startVM();
    }

    /**
     * Executes callback when the VM makes a request to render a new frame
     * @param cb 
     * @param alpha indicates wether we should inject fake alpha in the constructed image to facilitate rendering (note: if shouldSpreadImage is false alpha channel is always ignored)
     * @param shouldSpreadImage indicates if we should supply the image back with the combined RGB color (faster) or split each color into individual R,G,B sections
     */
    onImageUpdate(cb: (dat: number[])=>void, alpha = false, shouldSpreadImage = false){
        this.vm.onImageRenderRequest((x)=>{
            cb(shouldSpreadImage ? spreadImage(x, alpha) : x);
        });
    }

    startVM(){
        this.vm.run();
    }
    stopVM(){
        this.vm.execute(Instructions.HLT);
    }
}