// A pen-and-ink tree, generated at build time. Branches grow recursively with
// gnarled bends; thick limbs are drawn as bundles of pen lines (outline plus bark
// hatching, denser on the shadow side), thin twigs as single strokes, and the
// crown is dusted with specks. Each stroke records when it should start drawing,
// so the tree can grow in from the trunk out.
import { random } from './sketch';

type Point = [number, number];

export interface InkStroke {
  d: string;
  width: number;
  /** Seconds after the tree starts growing that this stroke starts drawing. */
  at: number;
  /** Seconds this stroke takes to draw. */
  dur: number;
}

export interface InkTree {
  viewBox: string;
  strokes: InkStroke[];
  /** All specks as one path; they fade in once the branches are done. */
  specks: string;
  specksAt: number;
}

interface Options {
  /** Depth of the branching. Each level roughly doubles the stroke count. */
  depth?: number;
  /** How much each segment bends, in radians. */
  gnarl?: number;
}

const SPEED = 190; // viewBox units drawn per second
const HALF_PI = Math.PI / 2;

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

function toPath(points: Point[]) {
  return 'M' + points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');
}

// Catmull-Rom through the control points, sampled `per` times per segment.
function smooth(points: Point[], per = 3): Point[] {
  const out: Point[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const [p1, p2] = [points[i], points[i + 1]];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    for (let s = 1; s <= per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

const length = (points: Point[]) =>
  points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);

export function inkTree(seed: string, { depth: maxDepth = 7, gnarl = 0.5 }: Options = {}): InkTree {
  const rand = random(seed);
  const range = (a: number, b: number) => a + (b - a) * rand();
  const strokes: InkStroke[] = [];
  const tips: Point[] = [];
  const all: Point[] = [];
  let end = 0;

  // Pen lines along a limb, offset across its width.
  function draw(spine: Point[], widths: number[], at: number) {
    const dur = length(spine) / SPEED;
    end = Math.max(end, at + dur);
    all.push(...spine);
    const w0 = widths[0];
    if (w0 < 3) {
      strokes.push({ d: toPath(spine), width: Math.max(0.45, Math.min(1.2, w0 * 0.32)), at, dur });
      return;
    }
    const normals = spine.map((_, i) => {
      const a = spine[Math.max(i - 1, 0)];
      const b = spine[Math.min(i + 1, spine.length - 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len] as Point;
    });
    const line = (offset: number, from: number, to: number, width: number) => {
      const i0 = Math.floor(from * (spine.length - 1));
      const i1 = Math.max(i0 + 2, Math.ceil(to * (spine.length - 1)));
      const pts = spine.slice(i0, i1 + 1).map(([x, y], k) => {
        const i = i0 + k;
        const o = (offset * widths[i]) / 2 + (rand() - 0.5) * 0.5;
        return [x + normals[i][0] * o, y + normals[i][1] * o] as Point;
      });
      strokes.push({ d: toPath(pts), width, at: at + from * dur, dur: (to - from) * dur });
    };
    const edge = Math.max(0.7, Math.min(1.6, w0 * 0.07));
    line(-1, 0, 1, edge);
    line(1, 0, 1, edge * 1.2);
    // Bark: partial lines, skewed toward the +1 (shadow) side.
    const bark = Math.floor(w0 / 1.9);
    for (let k = 0; k < bark; k++) {
      const from = rand() * 0.55;
      line(1 - 2 * rand() ** 1.5 * 0.95, from, Math.min(1, from + range(0.2, 0.7)), range(0.4, 0.7));
    }
    // Shading: a few short strokes across the shadow edge of thick limbs.
    const hatches = w0 > 14 ? Math.floor((length(spine) / 14) * (w0 / 40)) : 0;
    for (let k = 0; k < hatches; k++) {
      const i = Math.floor(rand() * (spine.length - 1));
      const w = widths[i] / 2;
      const [x, y] = spine[i];
      const [nx, ny] = normals[i];
      const o0 = range(0.55, 0.8) * w;
      const o1 = w * range(0.85, 1);
      const slant = range(0.2, 0.6) * w;
      const [tx, ty] = [ny * -1, nx];
      const pts: Point[] = [
        [x + nx * o0, y + ny * o0],
        [x + nx * (o0 + o1) * 0.5 + tx * slant * 0.5, y + ny * (o0 + o1) * 0.5 + ty * slant * 0.5],
        [x + nx * o1 + tx * slant, y + ny * o1 + ty * slant],
      ];
      strokes.push({ d: toPath(pts), width: range(0.4, 0.65), at: at + (i / spine.length) * dur, dur: 0.15 });
    }
  }

  function grow(start: Point, angle: number, len: number, width: number, depth: number, at: number, root = false) {
    const n = Math.max(3, Math.round(len / 16));
    const step = len / n;
    const points: Point[] = [start];
    const widths: number[] = [width];
    const angles: number[] = [angle];
    let a = angle;
    // Bends drift (curvature is a damped random walk), so limbs curve in S-shapes
    // rather than jitter; twigs get more crooked the further out they are.
    let bend = (rand() - 0.5) * 0.1;
    const crook = gnarl * (root ? 0.6 : 1 + depth * 0.12);
    for (let i = 1; i <= n; i++) {
      bend = bend * 0.55 + (rand() - 0.5) * crook;
      a += bend;
      // Limbs reach up; outer twigs mostly keep their direction.
      if (!root) a += (-HALF_PI - a) * (depth < 2 ? 0.08 : 0.025);
      const [x, y] = points[i - 1];
      points.push([x + Math.cos(a) * step, y + Math.sin(a) * step]);
      // Trunk flares at the base.
      const flare = depth === 0 && !root ? 1 + 0.45 * Math.exp((-i / n) * 7) : 1;
      widths.push(width * (1 - (0.3 * i) / n) * flare);
      angles.push(a);
    }
    widths[0] = widths[1] * (depth === 0 && !root ? 1.25 : 1);

    const spine = smooth(points);
    const spineWidths = spine.map((_, i) => widths[Math.min(Math.round(i / 3), widths.length - 1)]);
    draw(spine, spineWidths, at);
    const dur = length(spine) / SPEED;
    if (root) return;

    const tipWidth = widths[n];
    if (depth >= maxDepth || tipWidth < 0.9) {
      tips.push(points[n]);
      return;
    }

    // Side twigs along the way.
    if (depth >= 1) {
      for (let i = 1; i < n; i++) {
        if (rand() < 0.22) {
          const side = rand() < 0.5 ? -1 : 1;
          grow(points[i], angles[i] + side * range(0.6, 1.2), len * range(0.25, 0.45), widths[i] * 0.4, depth + 2, at + (dur * i) / n);
        }
      }
    }

    // Fork at the end: one dominant child, the rest thinner.
    const count = depth === 0 ? 2 : rand() < 0.28 ? 3 : 2;
    const spread = depth === 0 ? range(0.3, 0.4) : range(0.35, 0.75);
    for (let k = 0; k < count; k++) {
      const t = count === 1 ? 0 : (k / (count - 1)) * 2 - 1;
      const main = k === (rand() < 0.5 ? 0 : count - 1);
      grow(
        points[n],
        a + t * spread + (rand() - 0.5) * 0.2,
        len * (depth === 0 ? range(0.95, 1.15) : range(0.68, 0.86)),
        tipWidth * (depth === 0 ? range(0.72, 0.8) : main ? 0.74 : 0.55),
        depth + 1,
        at + dur,
      );
    }
  }

  grow([0, 0], -HALF_PI + range(-0.08, 0.08), 120, 40, 0, 0);
  // Roots spreading over the ground.
  for (const angle of [Math.PI - 0.15, 0.1, Math.PI - 0.5, 0.45]) {
    grow([range(-10, 10), -range(4, 12)], angle, range(30, 55), range(7, 12), 0, 0, true);
  }
  // Ground.
  for (let k = 0; k < 5; k++) {
    const x = range(-90, 30);
    const y = range(-1, 5);
    const g: Point[] = [[x, y], [x + range(20, 40), y + range(-1.5, 1.5)], [x + range(45, 80), y + range(-1, 2)]];
    strokes.push({ d: toPath(smooth(g)), width: 0.6, at: 0, dur: 0.4 });
    all.push(...g);
  }

  // Specks: around twig tips, scattered through the crown, and drifting down.
  const specks: string[] = [];
  const speck = ([x, y]: Point) => {
    const a = rand() * Math.PI;
    const l = rand() < 0.4 ? 0.1 : range(1, 2.6);
    specks.push(`M${fmt(x)} ${fmt(y)}l${fmt(Math.cos(a) * l)} ${fmt(Math.sin(a) * l)}`);
  };
  for (const [x, y] of tips) {
    for (let k = 0; k < 4; k++) speck([x + range(-14, 14), y + range(-14, 12)]);
  }
  const xs = tips.map((p) => p[0]);
  const ys = tips.map((p) => p[1]);
  const [minX, maxX, minY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys)];
  for (let k = 0; k < 90; k++) {
    const [x, y] = tips[Math.floor(rand() * tips.length)];
    speck([x + range(-25, 25), y + range(-10, 45)]);
  }
  for (let k = 0; k < 18; k++) speck([range(minX, maxX), range(minY + (0 - minY) * 0.5, -4)]);

  const pad = 8;
  const bx = all.map((p) => p[0]).concat(minX - 12, maxX + 12);
  const by = all.map((p) => p[1]).concat(minY - 12);
  const [x0, y0] = [Math.min(...bx) - pad, Math.min(...by) - pad];
  const [x1, y1] = [Math.max(...bx) + pad, Math.max(...by) + pad];

  return {
    viewBox: `${fmt(x0)} ${fmt(y0)} ${fmt(x1 - x0)} ${fmt(y1 - y0)}`,
    strokes,
    specks: specks.join(''),
    specksAt: end * 0.85,
  };
}
