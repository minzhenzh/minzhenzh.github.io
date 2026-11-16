### Background

Game NPCs that move through a level usually split the job in two: plan a route on a map (often with A*), then follow it with a controller that turns "where should I be" into movement. For a car, following is the hard half, because a car has momentum and a size.

### Why we built it

Our maze racer needs opponents that go around the track through a loop of checkpoints, lap after lap, without getting stuck on the snow banks, and that race the player in the same standings.

### What was hard

* **A path is not a driving line.** A* returns cell centers with sharp corners. We first steered with eight arrow-key directions, then replaced them with a PD controller aiming 20 points ahead on a Catmull-Rom spline through the path.
* **The car has a size.** A line through cell centers can still pass close enough to a wall for the side of a car to hit it. So walls are inflated by half the car's width before planning, and two whiskers from the front corners push the car away from anything the path missed.
* **Seeing what the NPC thinks.** The path, the target and the spline only exist as data. A grid overlay shows the planned cells and the target, and a line debugger draws every spline on the isometric map, which is how each stage was debugged.
