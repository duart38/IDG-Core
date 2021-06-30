# What's in here?
Files herein show an example of how the image builder could be implemented.
The implementations are written in typescript and try to not use any Deno-specific API.
Occasionally however, we do need to use Deno APIs (for example when saving to a file).

For the sake of showcasing (and since deno has no DOM) here any persistence instructions will use Deno.writeFile to write the image data to a file.