---
title: "Teaching an NPC Car to Race"
summary: "How the NPC car in our maze racer learned to drive, one piece at a time: A* for the route, a PD controller for the steering, a spline for a smooth line, whiskers for the walls, and debug lines to see what it was thinking."
label: "Blog · Game AI"
year: 2026
date: 2026-10-23
image: ./npc-racer/overview.png
imageAlt: "An NPC car on an isometric ice track leaving a trail of smoke puffs. Blocked snow cells are outlined in red, and a line of blue cells leads up the track to a red target cell."
---

Our maze racer needs opponents. An NPC car has to go around the track through a loop of checkpoints, three laps, without getting stuck on the snow banks. This post follows it from its first wobbly version to the one that races today, one piece at a time. From A* on, every stage has a short video, and the first four drive the same bend, so you can compare them.

## Day one: drive to the next target

The first NPC, in April 2026, had a list of target cells and drove straight at the next one. When it reached a target, it moved on to the next. Three laps was the goal.

Driving straight at a target works on open ice, but not when a snow bank is in the way, and the car got stuck. Our notes from that day list the first ideas: remember the last state, stop in the debugger when the car stops, and add a random push to shake it loose. A random push would only hide the real problem, though. The car didn't know where the walls were.

## A*: a route around the walls

So the car needed a map. We turn the track into a grid of walkable cells: road cells are free, everything else, and every obstacle on the road, is blocked. Then the NPC plans a route to the next checkpoint with A*:

```js
const heuristic = (col,row)=>{//octile distance
    const dx = Math.abs(col-goal[0]), dy = Math.abs(row-goal[1]);
    return Math.max(dx,dy) + (Math.SQRT2-1)*Math.min(dx,dy);
};
```

It searches all eight neighbors. A straight step costs 1, a diagonal step costs √2, and the octile distance is the matching estimate of what's left. One rule matters a lot for a car: a diagonal step is only allowed when both cells beside it are free, otherwise the path slips through the corner of a wall.

```js
//ATTN: diagonal step needs both side cells free, otherwise it cuts the wall corner
if(!isWalkable(nCol,nRow) || (dx && dy && !(isWalkable(nCol,row) && isWalkable(col,nRow))))
    continue;
```

The first driver on top of A* was simple. It looked two cells ahead on the path and "pressed" whichever of the eight arrow-key directions pointed closest, exactly like a player would:

```js
const sector = Math.round(a / (Math.PI/4)) % 8;
// ...
this.State = sectorToDir[sector];
```

<figure>
  <video src="/media/npc-racer/astar.mp4" poster="/media/npc-racer/astar.jpg" width="720" height="580" preload="none" muted loop playsinline></video>
  <figcaption>The A* stage. Blue cells are the planned path and the red cell is the next checkpoint. The car follows the path by steering in one of eight directions.</figcaption>
</figure>

The grid overlay was our first debug view. The remaining path cells, the current target and the checkpoints are drawn on the map every frame, so we could watch the plan and the car at the same time.

## PD: steer, don't press keys

Eight directions are coarse. The car can only turn in 45° steps, and it's a physics body with momentum, so a key press says nothing about how fast it is already moving. The next version replaced the keys with a PD controller, the same idea as a spring with a damper:

```js
let direction = [0,1].map(i=>
    this.positionGain*(target[i]-position[i]) - this.dampingGain*velocity[i] + repel[i]);
```

The P term pulls the car toward the target. The D term pushes against its current velocity, so it brakes before it arrives instead of swinging past. The result is a direction, not a key, and it becomes the car's traction force. We use a position gain of 0.8 and a damping gain of 0.35. If the two terms ever cancel out, the car simply heads straight for the target instead of stalling.

<figure>
  <video src="/media/npc-racer/pd-astar.mp4" poster="/media/npc-racer/pd-astar.jpg" width="720" height="524" preload="none" muted loop playsinline></video>
  <figcaption>The same bend with the PD controller doing the steering.</figcaption>
</figure>

## A spline: a line worth following

A* returns cell centers, and a line through cell centers has a sharp corner at every turn. The car could follow it, but it drove like a robot. So we run a Catmull-Rom spline through the cell centers and cut each segment into ten small "micro waypoints":

```js
out.push([0,1].map(k=>0.5*(
    2*p1[k] +
    (p2[k]-p0[k])*t +
    (2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2 +
    (3*p1[k]-p0[k]-3*p2[k]+p3[k])*t3)));
```

A Catmull-Rom curve passes through every point it's given, so the line still goes through the planned cells, just with round corners. To pick a target, the controller finds the micro waypoint closest to the car and aims 20 waypoints further along. Looking ahead is what makes the car start turning before the corner, not in it.

The spline is invisible data, so we built a line debugger for it. It draws any list of points as a polyline through the same isometric transform as the map, so the line lands exactly on the cells it belongs to. Every frame it gets each NPC's spline, plus the center line of the whole race track.

<figure>
  <video src="/media/npc-racer/spline.mp4" poster="/media/npc-racer/spline.jpg" width="720" height="560" preload="none" muted loop playsinline></video>
  <figcaption>The spline stage on the same bend. Blocked cells are outlined in red, and the thin line over the path cells is the spline, drawn by the line debugger.</figcaption>
</figure>

## A fat car and whiskers

All of this treated the car as a point. A real car has a width, and a line through the middle of the cells can still run close enough to a wall for the side of a wide car to hit it.

Two things fixed it. First, the walls get fatter before planning: every cell whose center is closer to a wall than half the car's width (with a 15% margin) is blocked too. Now A* plans a line that leaves room for the whole car.

Second, the car got whiskers. Two rays start at its front corners and angle outward. If one of them hits a wall, the car is pushed toward the other side, harder the closer the hit:

```js
const strength = this.repelForceMultiplier*(1-dist/this.maxWhiskerLength);
repel[0] -= sign*side[0]*strength;
repel[1] -= sign*side[1]*strength;
```

That push is the `repel` term in the PD formula above. The path keeps the car away from walls on average, and the whiskers handle what the path can't see, like a car sliding wide on the ice.

<figure>
  <video src="/media/npc-racer/fatcar-whisker.mp4" poster="/media/npc-racer/fatcar-whisker.jpg" width="720" height="560" preload="none" muted loop playsinline></video>
  <figcaption>The same bend again, now with a wider car, walls inflated by its width, and whiskers on.</figcaption>
</figure>

## Racing

The last step makes it a race. The race manager builds the track's center line by running A* from each checkpoint to the next, and measures every car's progress along it, NPC or player, to keep the standings. The NPC controller takes its numbers as parameters, so two NPCs can drive differently: one with short whiskers and gentle gains, one with wider, longer whiskers and stronger damping. And now the cars leave a trail of smoke.

<figure>
  <video src="/media/npc-racer/smoke.mp4" poster="/media/npc-racer/smoke.jpg" width="720" height="560" preload="none" muted loop playsinline></video>
  <figcaption>The race. The NPC car leaves a trail of smoke through the corner, and a second car pulls alongside for a moment.</figcaption>
</figure>

## What we took away

* A path is not a driving line. A* finds the route, a spline makes it drivable, and a controller drives it.
* Steer with forces, not keys. A PD controller turns "where should I be" into a smooth push, and its damping stops the overshoot.
* Look ahead. Aiming a little further down the line is what makes a car turn before the corner.
* Plan for the car you have. Fatten the walls by the car's width, then let whiskers catch the rest.
* Draw the invisible. The path, the target and the spline only exist as data, and the grid overlay and line debugger were how we found every bug in this post.
