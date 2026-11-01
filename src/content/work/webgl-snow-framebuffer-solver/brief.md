### Background

A snowflake's position depends on where it was a moment ago: gravity pulls it, wind pushes it, air slows it. So a snow simulation has to remember every flake between frames. WebGL1 has no compute shaders and no transform feedback. The only memory a shader can write to is a texture.

### Why we built it

We wanted the whole simulation on the GPU, not a JavaScript loop. So each flake lives in the pixels of float textures, and a fragment shader, which runs once per pixel, becomes a physics solver that updates every flake each frame.

### What was hard

* **Nowhere to write.** A shader can't read a texture while writing into it, so we keep two framebuffers and swap them every frame (ping-pong).
* **Four numbers per pixel is not enough.** A flake needs more, so one draw writes four textures at once (`WEBGL_draw_buffers`). Our very first solver shader only wrote four flat colors, to check that part before trusting it.
* **Bugs that fail silently.** Sample half a pixel off and a flake reads its neighbor's data. Spawn points from `Math.random()` clump and leave holes, so we switched to a Halton sequence. And to tune the forces, all the knobs sit on `window`, so we could change the weather live from the console.
