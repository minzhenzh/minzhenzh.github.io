### Background

Keeping data in textures and letting a fragment shader compute the next value of every pixel is an old trick. Before compute shaders existed, it was how people did general computation on GPUs, called GPGPU. Mark Harris's *GPU Gems* fluid chapter (2004) calls each such pass a slab operation. The same idea led to BrookGPU, then to NVIDIA's CUDA in 2007, which is a big part of why AI runs on graphics cards today. WebGL2 still has no compute shaders, so for us it's still the way to compute on the GPU.

### Why we built it

Our flow field and boids work already ran on a framebuffer solver, and only there can a particle read any other particle, because the whole state is a texture. So we ported our transform feedback particle solver to framebuffers, letting every demo run on either solver with one switch.

### What was hard

* **13 floats, 4 channels.** A texture pixel holds only four numbers, so each particle is split across four textures. And since the texture is square, the particle count has to be a perfect square, so snow went from 1000 to 1024 particles.
* **Why not just uniforms?** One uniform array per parameter looks simpler, but a shader can't write uniforms back. The CPU would have to update every particle and call `setUniform` before every draw, and WebGL2 only guarantees room for 256 uniform vectors.
* **Proving the port right.** We copied the solver logic line for line and ran both versions side by side. If the two ever look different, it's a bug.
