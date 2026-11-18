### Background

Boids and fluids are two classic simulations. Boids are simple agents that stay together, swim the same way and keep a little distance, and a school appears from those three rules. A fluid solver keeps a velocity for every point of the water and moves dye along with it. Each one is usually shown alone.

### Why we built it

We wanted a school of fish that really lives in the water. A current should carry the fish, and the fish should move the water and leave a trail in it. We started from Pavel Dobryakov's WebGL Fluid Simulation and added our boids to it. Everything had to stay on the GPU and run from plain files with no build step, so it can sit on a static page.

### What was hard

* **The grid showed through.** Our boids find their neighbors by being drawn into a grid. Reading one cell gave every boid in that cell the same answer, and the school collapsed onto the grid. Later, dense schools lined up in rows. Blending the cells around each boid fixed the first, and moving the fine grid by a random fraction of a cell every frame fixed the second.
* **Pushing the water with thousands of fish.** The fluid's own splat is one pass over the screen for each push. So all the boids are drawn at once as small additive points into a force texture, and one pass adds it to the water.
* **Keeping it calm.** The fish push the water and the water carries the fish, so the two can speed each other up. A fish only pushes until the water moves with it. In the first version of the entrance the school also shot across the screen and piled up against the far wall, so swimming speed is now limited against the water.
* **Too much light.** With additive blending, a packed school burned out to white. Each fish now gives a little less light where the school is dense.
