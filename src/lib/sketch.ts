// Hand-drawn shapes as SVG path data, generated at build time. A string seed
// (e.g. the entry id) keeps each shape stable between builds.

export function random(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  // mulberry32
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = [number, number];

// One slightly bowed stroke from a to b that starts a little early and overshoots the end.
function stroke(a: Point, b: Point, wobble: number, rand: () => number) {
  const jitter = () => (rand() - 0.5) * 2 * wobble;
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const bow = (rand() - 0.5) * 2 * wobble;
  const at = (t: number, overshoot: number, off: number): string => {
    const x = a[0] + dx * t + ux * overshoot - uy * off + jitter() * 0.3;
    const y = a[1] + dy * t + uy * overshoot + ux * off + jitter() * 0.3;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  const start = at(0, -wobble * rand(), jitter() * 0.5);
  const end = at(1, wobble * (0.5 + rand()), jitter() * 0.5);
  return `M${start}C${at(0.33, 0, bow)} ${at(0.66, 0, bow * (0.6 + rand() * 0.8))} ${end}`;
}

// A rectangle filling a w×h viewBox, traced twice like a quick pencil sketch.
export function sketchRect(seed: string, w: number, h: number, wobble = 1.2) {
  const rand = random(seed);
  const corners: Point[] = [[0, 0], [w, 0], [w, h], [0, h]];
  const passes = [0, 1].map(() =>
    corners.map((corner, i) => stroke(corner, corners[(i + 1) % 4], wobble, rand)).join(''),
  );
  return passes;
}

// A loose horizontal marker line across a w-wide viewBox at height y.
export function sketchLine(seed: string, w: number, y: number, wobble = 1.5) {
  return stroke([0, y], [w, y], wobble, random(seed));
}
