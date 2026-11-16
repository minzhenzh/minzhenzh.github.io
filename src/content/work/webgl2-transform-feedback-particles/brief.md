### Background

A particle system has to remember where every particle was in the last frame. WebGL1 can only do that by storing particles in texture pixels. WebGL2 added transform feedback, which records the vertex shader's outputs into a buffer instead of drawing them. If the shader reads a particle, moves it and writes it out, the buffer holds the next frame.

### Why we built it

A particle fits more naturally as a vertex than as a pixel. With transform feedback, snow, rain, leaves and flowers are simulated entirely on the GPU, and the CPU never touches a single position.

### What was hard

* **Learning a new API.** Before writing any particles, we worked through small WebGL2 samples, until one about a hundred lines long showed the whole idea.
* **Reading and writing at once.** A draw can't read and write the same buffer. So there are two buffers, each with its own vertex array and feedback object, and the outputs keep exactly the 52-byte layout of the inputs so the two can swap every frame.
* **Seeing what the GPU does.** Before leaves, we built a test demo where every particle is an arrow pointing where it's going. Leaves reuse the same rotation, and their animation frame follows the wind's push instead of the clock.
