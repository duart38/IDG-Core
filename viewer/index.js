console.log("index.js loaded");
function spreadRGB(input) {
    const red = ((input>>16) & 0x0ff);
    const green = ((input>>8) & 0x0ff);
    const blue = ((input)    & 0x0ff);
    return [red, green, blue];
}
function printStuff(){
  console.log("Printing stuff");
}

function coordinatesByIndex(i, width) {
  //i = i / 4;
  const x = Math.floor(i % width); // % is the "modulo operator", the remainder of i / width;
  const y = Math.floor(i / width); // where "/" is an integer division
  return [x, y];
}

let machine = null;
const imageURL = "seeds.idg";
const canvas = document.getElementById('canvas');

const loadVM = (startOnLoad = false) => {
    if(machine == null){
      console.log("Loading worker containing the VM")
      machine = new Worker('worker.js');
      const context = canvas.getContext('2d');
      context.fillText("Loading",9,9);

      machine.onmessage = (e) => {
        if(e.data[0] === "loaded"){
          console.log(e.data[1]);
          canvas.width = e.data[1].width;
          canvas.height = e.data[1].height;
          if(startOnLoad) {
            machine.postMessage(["start"]);
          }
        }else{
          setTimeout(() => {
            const data = e.data;
            for(const ins of data){
              switch(ins[0]){
                case 0: {
                  const [x,y] = coordinatesByIndex(ins[1], canvas.width);
                  const [r,g,b] = spreadRGB(ins[2]);
                  context.fillStyle = `rgb(${r},${g},${b}, 255)`;
                  context.fillRect(x, y, 1, 1);
                  break;
                }
              }
            }
          },1);
        }
      }
      machine.postMessage(["load", imageURL]);
    }
    else{
      return;
    }
}

loadVM(true);