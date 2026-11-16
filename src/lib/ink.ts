// Shared by the canvas drawings (InkPlanet, WorkWaves): the theme's ink colours,
// seeded noise so every stroke keeps its own hand, and a frame loop that only
// runs while its canvas is on screen.

const frac = (v: number) => v - Math.floor(v);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** A stable pseudo-random number in [0, 1) for a seed. */
export const hash = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** Smooth 1D value noise in [0, 1). */
export function noise1(x: number) {
  const i = Math.floor(x);
  return hash(i) + (hash(i + 1) - hash(i)) * smooth(x - i);
}

/** Smooth 2D value noise in [0, 1). */
export function noise2(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const corner = (cx: number, cy: number) => hash(cx + cy * 57.31);
  const a = corner(xi, yi);
  const b = corner(xi + 1, yi);
  const c = corner(xi, yi + 1);
  const d = corner(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Smooth 3D value noise in [0, 1), from two slices of the 2D noise. */
export function noise3(x: number, y: number, z: number) {
  const zi = Math.floor(z);
  const a = noise2(x + zi * 31.7, y + zi * 17.3);
  const b = noise2(x + (zi + 1) * 31.7, y + (zi + 1) * 17.3);
  return a + (b - a) * smooth(z - zi);
}

/** Ink and pencil colours of the current theme, read from the CSS tokens. */
export function inkColors() {
  const style = getComputedStyle(document.documentElement);
  return { ink: style.getPropertyValue('--fg').trim(), pencil: style.getPropertyValue('--muted').trim() };
}

/** Runs `callback` when the theme changes, by the toggle or by the system. */
export function onThemeChange(callback: () => void) {
  new MutationObserver(callback).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback);
}

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/** Sizes a canvas's bitmap to its CSS box and returns the box size in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, maxDpr = 2) {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

/**
 * Calls `draw(seconds since the last frame)` on every frame, but only while
 * `element` is on screen, the tab is visible, and motion is allowed.
 */
export function animate(element: Element, draw: (dt: number) => void, fps = 60) {
  let onScreen = false;
  let request = 0;
  let last = 0;

  const frame = (now: number) => {
    request = requestAnimationFrame(frame);
    if (last && now - last < 1000 / fps - 3) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    draw(dt);
  };
  const sync = () => {
    const run = onScreen && !document.hidden && !reducedMotion.matches;
    if (run && !request) {
      last = 0;
      request = requestAnimationFrame(frame);
    } else if (!run && request) {
      cancelAnimationFrame(request);
      request = 0;
    }
  };

  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    },
    { rootMargin: '64px' },
  ).observe(element);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
}
