### Background

Isometric games draw a world that looks 3D using flat 2D sprites. The grid is turned 45° and squashed, so every cell becomes a diamond. For the scene to look right, every sprite has to stand exactly on its diamond and be drawn in the right order.

### Why we built it

Our cat café game is built tile by tile in a level editor. Its 2024 web demo draws with Canvas 2D, where JavaScript places every sprite and calls `drawImage` for each one, so the CPU has more work with every cat and chair. The WebGL2 version moves that work to the GPU. The vertex shader places every sprite and the fragment shader picks the animation frames. Once the map is sorted, a frame only needs a time update and a few batched draw calls.

### What was hard

* **One transform for every kind of sprite.** Tiles, walls, furniture that covers several cells, characters and particles all go through the same function, with one matrix and a different pivot for each. Characters are placed by their center and tiles by their corner, so a character's pivot is a quarter tile instead of a half.
* **Drawing order.** A cat behind a table must not appear on top of it. Sprites are sorted back to front, with extra swaps for furniture that spans several cells. The order is then stored as depth, so the depth buffer keeps it across batches.
* **Platform limits.** WeChat Mini Games on Android limit the texture size, so big sprite sheets are cut into slices that the shader puts back together. GLSL ES only allows constant sampler indices, and mipmap lookups don't work inside branches, so each slice needs its own `if` and an explicit `textureLod`.
