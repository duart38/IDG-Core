import IDGVM from "../Machine.ts";

export class WSManager{
    sockets: Map<string, WebSocket>;
    constructor(){
        this.sockets = new Map();
    }
    
    connect(url: string): WebSocket {
        if(this.sockets.has(url)) return this.sockets.get(url)!;
        const newWS = new WebSocket(url);
        this.sockets.set(url, newWS);
        return newWS;
    }
    static decodeIncomingURL(vm: IDGVM, size: number): string{
        const strBuffer = new Uint8Array(size);
        for(let i = 0; i < strBuffer.length; i++){
          strBuffer[i] = vm.fetchCurrentInstruction8();
        }
       return  new TextDecoder().decode(strBuffer);
    }
}

export enum SocketBindType {
    /**
     * Binds the first element in the WS returned int8 array to the register provided
     */
    BIND_MESSAGE_REG,
    BIND_MESSAGE_MEM, // TODO: maybe overlay the entire int8 arr in mem instead  of first val?
    // TODO: bind close, error, etc etc.
}
export function bindToSocket(_this: IDGVM, param: number[]) {
    switch(param[1]){
        case SocketBindType.BIND_MESSAGE_REG : {
            const addr = param[2];
            const sizeOfStr = param[3];
            const strBuffer = new Uint8Array(sizeOfStr);
            for(let i = 0; i < strBuffer.length; i++){
                strBuffer[i] = _this.fetchCurrentInstruction8();
            }
            _this.wsManager?.connect(new TextDecoder().decode(strBuffer)).addEventListener("message", async(e)=>{
                if(e.data instanceof Blob){
                    _this.setRegisterAt(addr, new Uint8Array((await (e.data as Blob).arrayBuffer()))[0]);
                    console.log(_this.getRegisterAt(addr));
                }
            })
            break;
        }
    }
}