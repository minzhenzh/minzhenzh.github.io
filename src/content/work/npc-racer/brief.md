### Background

Game NPCs that move through a level usually split the job in two. They plan a route on a map, often with A*, and then follow it with a controller that turns the next target into movement. For a car, following the route is the harder part, because a car has momentum and a size.

### Why we built it

Our maze racer needs opponents. They have to drive around the track through a loop of checkpoints, lap after lap, without getting stuck on the snow banks, and race the player in the same standings.

### What was hard

* **Turning a path into a driving line.** A* returns cell centers with sharp corners. We first steered with eight arrow-key directions, then replaced them with a PD controller that aims 20 points ahead on a Catmull-Rom spline through the path.
* **The size of the car.** A line through cell centers can still pass close enough to a wall for the side of a car to hit it. So the walls are inflated by half the car's width before planning, and two whiskers at the front corners push the car away from walls the path didn't account for.
* **Seeing what the NPC is doing.** The path, the target and the spline only exist as data. A grid overlay shows the planned cells and the target, and a line debugger draws every spline on the isometric map. We used both to debug each stage.
