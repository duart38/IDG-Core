import { decode } from "https://deno.land/x/pngs/mod.ts";

console.log(
    decode(Deno.readFileSync("/Users/duartasnel/Downloads/untitled2.png")).image.toString()
)
