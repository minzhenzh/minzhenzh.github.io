### Background

Isometric games draw a 3D-looking world with flat 2D sprites. The grid is turned 45° and squashed, so every cell becomes a diamond, and the illusion only works if every sprite stands exactly on its diamond and is drawn in the right order.

### Why we built it

Our cat café game is built tile by tile in a level editor. Its 2024 web demo draws with Canvas 2D: JavaScript places every sprite and calls `drawImage` for each one, so the CPU's work grows with every cat and chair. The WebGL2 version moves that work to the GPU. The vertex shader places every sprite, the fragment shader picks animation frames, and once the map is sorted, a frame is just a time update and a few batched draw calls.

### What was hard

* **One transform for everything.** Tiles, walls, multi-cell furniture, characters and particles all go through the same function, with one matrix and a different pivot for each. Characters are placed by their center and tiles by their corner, so a character's pivot is a quarter tile instead of a half.
* **Drawing order.** A cat behind a table must not appear on top of it. Sprites are sorted back to front, with extra swaps for furniture that spans several cells, and the order is then turned into depth, so the depth buffer keeps it across batches.
* **Platform limits.** On Android, WeChat Mini Games cap texture size, so big sprite sheets are cut into slices that the shader stitches back together. GLSL ES only allows constant sampler indices, and mipmap lookups fail inside branches, so each slice needs its own `if` and an explicit `textureLod`.
