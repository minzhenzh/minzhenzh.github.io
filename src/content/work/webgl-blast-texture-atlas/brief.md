### Background

Animated effects in games, like fire, smoke or sparks, usually come as a sprite sheet: every frame of the animation laid out in one image, called a texture atlas. Playing the animation means showing a different tile of that image each frame.

### Why we built it

Blast is where our particle work started, in November 2024. We wanted every particle to play a 36-frame fire animation with no video and no image per frame: one texture, and a few lines of shader math that pick the right tile for every particle, every frame.

### What was hard

* **Checking math you can't print.** A shader can't log which frame it picked, so we tested with a strip of digits 0 to 7. If a particle showed "3" when we expected 3, the math was right, and an off-by-one was obvious at a glance.
* **From a strip to a grid.** Real fire comes as a 6 × 6 grid, so a frame number has to become a column and a row. That became a small helper any shader can include.
* **Fewer moving parts.** Each particle started as a quad whose corners we turned toward the camera ourselves. Drawing points instead gives one vertex per particle that always faces the camera. And since every particle has its own clock, the ring doesn't flicker in sync.
