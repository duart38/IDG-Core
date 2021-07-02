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
  
// export const CreateDumpToDiskDisplay = () => {
//     return {
//       getUint16: () => 0,
//       getUint8: () => 0,
//       setUint16: (address: number, data: number) => {
//         const command = (data & 0xff00) >> 8;
//         const characterValue = data & 0x00ff;
  
//         if (command === 0xff) {
//           eraseScreen();
//         } else if (command === 0x01) {
//           setBold();
//         } else if (command === 0x02) {
//           setRegular();
//         }
  
//         const x = (address % 16) + 1;
//         const y = Math.floor(address / 16) + 1;
//         moveTo(x * 2, y);
//         const character = String.fromCharCode(characterValue);
//         console.log(character);
//       }
//     }
//   };
  