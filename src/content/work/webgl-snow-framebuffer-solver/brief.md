### Background

A snowflake's position depends on where it was a moment ago, because gravity pulls it, wind pushes it and air slows it down. So a snow simulation has to remember every flake between frames. WebGL1 has no compute shaders and no transform feedback, and the only memory a shader can write to is a texture.

### Why we built it

We wanted the whole simulation to run on the GPU instead of in a JavaScript loop. So each flake lives in the pixels of float textures, and a fragment shader, which runs once per pixel, works as a physics solver that updates every flake each frame.

### What was hard

* **Writing the next frame.** A shader can't read a texture while writing into it, so we keep two framebuffers and swap them every frame (ping-pong).
* **Fitting a flake into pixels.** A pixel holds four numbers and a flake needs more, so one draw writes four textures at once (`WEBGL_draw_buffers`). Our very first solver shader only wrote four flat colors, to check that this worked before we relied on it.
* **Bugs that don't show up as errors.** If a lookup is half a pixel off, a flake reads its neighbor's data. Spawn points from `Math.random()` clump together and leave gaps, so we switched to a Halton sequence. To tune the forces, we put all the settings on `window` and changed the weather live from the console.
