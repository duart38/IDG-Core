import IDGBuilder from "./IDGVM/Builder/Builder.ts";
import IDGLoader from "./IDGVM/Loader.ts";


const builder = new IDGBuilder({
    imageData: [
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,
    ],
    width: 10, height: 6
});

const compiled = builder.compile();




// test loading compiled code
const loader = new IDGLoader(compiled);
//loader.
