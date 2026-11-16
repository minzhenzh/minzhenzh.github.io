### Background

Animated effects in games, like fire, smoke or sparks, usually come as a sprite sheet, with every frame of the animation laid out in one image called a texture atlas. Playing the animation means showing a different tile of that image each frame.

### Why we built it

Blast is where our particle work started, in November 2024. We wanted every particle to play a 36-frame fire animation from a single texture, without a video or one image per frame. A few lines of shader math pick the right tile for every particle in every frame.

### What was hard

* **Checking math we couldn't print.** A shader can't log which frame it picked, so we tested with a strip of the digits 0 to 7. If a particle showed "3" when we expected 3, the math was right, and an off-by-one error was easy to spot.
* **Going from a strip to a grid.** Real fire comes as a 6 × 6 grid, so a frame number has to become a column and a row. That became a small helper that any shader can include.
* **Simplifying the particles.** Each particle started as a quad whose corners we turned toward the camera ourselves. Drawing points instead gives one vertex per particle that always faces the camera. Every particle also has its own clock, so the ring doesn't flicker in sync.
