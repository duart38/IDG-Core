// const eraseScreen = () => {
//     console.log('\x1b[2J');
//   }

//   const moveTo = (x: number, y: number) => {
//     console.log(`\x1b[${y};${x}H`);
//   }

//   const setBold = () => {
//     console.log('\x1b[1m');
//   }

//   const setRegular = () => {
//     console.log('\x1b[0m');
//   }

export const CreateDumpToDiskDisplay = () => {
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
