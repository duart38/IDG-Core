import { DecodedFile } from "../interfaces/FileShape.ts";
import { deCompress } from "../utils/bits.ts";
import { spreadImage } from "../utils/color.ts";
import IDGVM from "./Machine.ts";
import { createMemory, MemoryMapper } from "./Memory.ts";
import { Instructions } from "./Registers.ts";


export default class IDGLoader {
    private vm: IDGVM;
    private memoryMapper: MemoryMapper;
    constructor(rawFileData: Uint8Array, autoStart = false){
        const loaded = IDGLoader.fileLoader(rawFileData);
        // console.log(loaded);

        this.memoryMapper = new MemoryMapper();
        const memory = createMemory(loaded.memoryRequest);
        this.memoryMapper.map(memory, 0, memory.byteLength);
        const writableBytes = new Uint8Array(memory.buffer);
        writableBytes.set(loaded.memorySection);

        this.vm = new IDGVM(this.memoryMapper, loaded);
        this.vm.viewMemoryAt(0, 20)
        if(autoStart) this.startVM();
    }

    static loadFromImage(url: string){
        // TODO: make this. (fetch https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API for web worker support)
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
    /**
     * Loads the raw and compressed IDG file and turns it into a usable result.
     * @param rawFileData the compressed file, received as is
     */
    static fileLoader(rawFileData: Uint8Array): DecodedFile {
        const decompressed = deCompress(rawFileData);
        const x = new DataView(decompressed.buffer);
        const imageWidth = x.getUint32(0);
        const imageHeight = x.getUint32(4);
        const memorySizeRequest = x.getUint32(8);
        const stackSizeRequirement = x.getUint32(12);
        console.log(`Attempting to load file. header info w(${imageWidth}), h(${imageHeight}), mem(${memorySizeRequest}), stack(${stackSizeRequirement})`)

        const image: number[] = [];
        let i = 16;
        for(;i < ((imageWidth * imageHeight) * 4) + 13; i += 4){
            image.push(x.getUint32(i));
        }
        console.log("LOADER IMAGE LENGTH", image.length)
        const memorySection = decompressed.slice(i,  i + memorySizeRequest);
        
        return {
            imageWidth, imageHeight, memoryRequest: memorySizeRequest,
            image, memorySection, stackSizeRequirement
        }
    }

    startVM(){
        this.vm.run();
    }
    stopVM(){
        this.vm.execute(Instructions.HLT);
    }
}