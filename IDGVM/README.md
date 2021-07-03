# What this is.
We already have a "working" prototype of the system but we would like to transition to a VM

# The rules
1. We need to define interfaces so that the VM can be implemented with other languages
2. No platform or language specific code in the VM, only in the connected I/O or Loader
3. Our base-line language target is C (i.e. if it works in C and can be implemented in C without platform specific packages then it's good enough for us)
4. If the code can be done mathematically with a limited number of parameters then put it in the VM
5. If the code contains a bunch of instructions chained together consider implementing that in a higher level language or abstraction that generates this code.. (this keeps the VM less cluttered)

# The new file
The new file only includes numbers... and maybe some other non numerical characters to differentiate more easily between different parts of the file..

## The start of the file (very first line) needs to include:
1. information about the image size (used to calculate where the image ends but ofcourse also to load the image).
2. information about the color depth
3. information about the size of the memory section (how big)

## the image section
Furthermore we need the image section that actually holds the RGB values.

## The memory section
This includes the actual memory space that is pre-allocated for the operations to run.
This does not need to be populated and the Machine should allocate based on the header and make everything else 0


# The Machine
actually a virtual CPU that executes instructions. supports interrupts for attaching things like a display or a timer.
Supply it with a memory so that it has space..

# Loader
Loads stuff in the machine.. will read the information header of the file and based on this allocate stuff. It also takes care of moving the static data from the file into the memory of the system



# Links
https://deno.land/x/imagescript@1.2.7
