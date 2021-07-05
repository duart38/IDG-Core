export const CreateClock = () => {
    return {
      getUint16: () => 0,
      getUint8: () => 0,
      setUint16: () => 0,
      // Triggered when something in the overlapping memory of this I/O is set
      setUint32: (address: number, data: number) => {
        //const command = (data & 0xff00) >> 8;
        //const characterValue = data & 0x00ff;
        console.log("\n\n\n\n\n",address, data,"\n\n\n\n\n\n\n");
      },
    };
};