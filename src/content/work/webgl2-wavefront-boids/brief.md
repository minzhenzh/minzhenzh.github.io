### Background

Moving many characters toward one place is a classic game problem. If every character searches for its own path, the cost grows with the crowd. A flow field turns it around: measure the distance to the target once for the whole map (the wavefront), turn it into an arrow in every cell, and each character simply follows the arrow under its feet. Boids add the crowd behavior on top, so the group moves together without piling up.

### Why we built it

We wanted a crowd that turns the moment you click, so everything runs on the GPU in WebGL2: the wavefront, the arrows and the boids. Every cell and every agent is a pixel, and all of them are updated at the same time.

### What was hard

Debugging on the GPU. A shader has no `console.log` and no breakpoints, and when something is wrong you get a texture of wrong numbers, or nothing on screen at all. So we never wrote the GPU version first:

* **CPU first.** The grid started as a plain HTML canvas page, with the wavefront and the arrows written in ordinary JavaScript, where every value can be printed and checked.
* **A different shape on the GPU.** The CPU version grows the wave ring by ring from a list of cells. A fragment shader has no list; it updates every cell at once. So the algorithm became "take your smallest neighbor plus one", repeated every frame.
* **Checked against the CPU.** The GPU version reads every pass back into the same page, so its numbers and arrows can be compared with the CPU's, cell by cell. For what happens inside a pass, we used the [Spector.js](https://spector.babylonjs.com/) Chrome extension.
