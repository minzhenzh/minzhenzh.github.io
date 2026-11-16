### Background

Keeping data in textures and letting a fragment shader compute the next value of every pixel is an old trick. Before compute shaders existed, it was how people did general computation on GPUs, which became known as GPGPU. Mark Harris's fluid chapter in *GPU Gems* (2004) calls each such pass a slab operation. The same idea led to BrookGPU and then to NVIDIA's CUDA in 2007, which is a big part of why AI runs on graphics cards today. WebGL2 still has no compute shaders, so this is still how we compute on the GPU.

### Why we built it

Our flow field and boids work already ran on a framebuffer solver. There the whole state is a texture, so a particle can read any other particle. We ported our transform feedback particle solver to framebuffers too, so every demo can run on either solver with one switch.

### What was hard

* **Fitting 13 floats into 4 channels.** A texture pixel holds only four numbers, so each particle is split across four textures. The texture is square, so the particle count has to be a perfect square, and snow went from 1000 to 1024 particles.
* **Choosing textures over uniforms.** One uniform array per parameter looks simpler, but a shader can't write uniforms back. The CPU would have to update every particle and call `setUniform` before every draw, and WebGL2 only guarantees room for 256 uniform vectors.
* **Checking that the port was right.** We copied the solver logic line for line and ran both versions side by side. If they ever look different, there's a bug.
