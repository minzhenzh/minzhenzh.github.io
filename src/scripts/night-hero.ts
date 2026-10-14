// Night-sky hero: a recursively branching tree grows from the bottom-right corner,
// then golden stars and crescent moons drift down and hang from its branches on threads.
// Canvas 2D only. Colors come from CSS variables on the hero; everything else is in CONFIG.

const CONFIG = {
  seed: 11, // change for a different tree
  growMs: 3000, // tree growth, start to finish
  depth: 9, // branching levels above the trunk
  trunkLean: -0.12, // radians from vertical; negative leans left, into the page
  lengthDecay: [0.72, 0.84], // child length / parent length
  widthDecay: 0.7, // child width / parent width
  spread: [0.5, 0.82], // radians between neighbouring child branches
  ornaments: { desktop: 100, mobile: 45, mobileBelow: 640 }, // stars + moons
  moonShare: 0.3,
  starSize: [7, 13], // px
  moonSize: [9, 15], // px
  threadLength: [14, 46], // px
  dropMs: [2600, 4200], // fall + ease into the anchor
  dropStagger: 3200, // ornaments start within this window after the tree finishes
  settleMs: 3500, // damped sway after arriving
  maxDpr: 2,
} as const;

type Range = readonly [number, number];

interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  depth: number;
  start: number;
  dur: number;
  drawn: number; // fraction already painted onto the cached tree canvas
}

interface Ornament {
  sprite: HTMLCanvasElement;
  size: number;
  thread: number;
  ax: number; // anchor on a branch
  ay: number;
  sx: number; // where the thread's top starts, above the hero
  sy: number;
  delay: number;
  dur: number;
  phase: number;
  sway: number;
}

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTree(w: number, nightH: number, baseY: number, small: boolean, rand: () => number): Segment[] {
  const between = ([a, b]: Range) => lerp(a, b, rand());
  const segments: Segment[] = [];
  const trunk = small ? Math.min(nightH * 0.1, w * 0.24) : Math.min(nightH * 0.15, w * 0.13);
  const levelMs = CONFIG.growMs / (CONFIG.depth + 1);

  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number, start: number) => {
    const x1 = x + Math.cos(angle) * len;
    const y1 = y + Math.sin(angle) * len;
    const dur = levelMs * lerp(0.8, 1.2, rand());
    segments.push({ x0: x, y0: y, x1, y1, width, depth, start, dur, drawn: 0 });
    if (depth >= CONFIG.depth) return;

    const children = depth < 2 ? 2 + (rand() < 0.5 ? 1 : 0) : rand() < 0.35 ? 3 : 2;
    const spread = between(CONFIG.spread);
    for (let i = 0; i < children; i++) {
      // Fan children around the parent's direction, nudged slightly upward.
      let a = angle + (i - (children - 1) / 2) * spread + (rand() - 0.5) * 0.3;
      a = lerp(a, -Math.PI / 2, 0.08);
      grow(x1, y1, a, len * between(CONFIG.lengthDecay), Math.max(width * CONFIG.widthDecay, 0.5), depth + 1, start + dur);
    }
  };

  grow(w * (small ? 0.84 : 0.85), baseY, -Math.PI / 2 + CONFIG.trunkLean, trunk, small ? 8 : 13, 0, 0);

  // Normalise timing so the whole tree finishes in exactly growMs.
  const end = Math.max(...segments.map((s) => s.start + s.dur));
  const k = CONFIG.growMs / end;
  for (const s of segments) {
    s.start *= k;
    s.dur *= k;
  }
  return segments;
}

function makeSprite(kind: 'star' | 'moon', color: string, glow: string, dpr: number) {
  const size = 32; // drawn larger than used, then scaled down with drawImage
  const pad = 10;
  const px = Math.ceil((size + pad * 2) * dpr);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const c = size / 2 + pad;

  const shape = document.createElement('canvas');
  shape.width = shape.height = px;
  const s = shape.getContext('2d')!;
  s.scale(dpr, dpr);
  s.fillStyle = color;
  if (kind === 'star') {
    s.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size / 2 : size / 4.6;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      s.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    s.closePath();
    s.fill();
  } else {
    s.beginPath();
    s.arc(c, c, size / 2, 0, Math.PI * 2);
    s.fill();
    s.globalCompositeOperation = 'destination-out';
    s.beginPath();
    s.arc(c + size * 0.28, c - size * 0.12, size / 2.15, 0, Math.PI * 2);
    s.fill();
  }

  ctx.shadowColor = glow;
  ctx.shadowBlur = 8;
  ctx.drawImage(shape, 0, 0, px / dpr, px / dpr);
  ctx.shadowBlur = 0;
  ctx.drawImage(shape, 0, 0, px / dpr, px / dpr);
  return { canvas, scale: (size + pad * 2) / size };
}

export function initNightHero(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  const fade = hero.querySelector<HTMLElement>('[data-hero-fade]');
  const text = hero.querySelector<HTMLElement>('[data-hero-text]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const css = getComputedStyle(hero);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const colors = {
    tree: color('--tree'),
    thread: color('--thread'),
    star: color('--star'),
    glow: color('--star-glow'),
  };

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tree = document.createElement('canvas');
  const treeCtx = tree.getContext('2d')!;

  let dpr = 1;
  let w = 0;
  let h = 0;
  let nightH = 0;
  let baseY = 0;
  let segments: Segment[] = [];
  let ornaments: Ornament[] = [];
  let sprites: Record<'star' | 'moon', { canvas: HTMLCanvasElement; scale: number }> | null = null;

  // Animation clock: only advances while the animation is actually running.
  let started = false;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let done = false;
  let inView = true;

  const growDone = () => clock >= CONFIG.growMs;
  const dropClock = () => clock - CONFIG.growMs;
  const totalMs = () =>
    CONFIG.growMs + CONFIG.dropStagger + CONFIG.dropMs[1] + CONFIG.settleMs;

  function layout() {
    const rect = hero.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    w = rect.width;
    h = rect.height;
    const fadeH = fade?.offsetParent ? fade.offsetHeight : 0;
    nightH = h - fadeH;
    // Root the trunk partway into the fade band so its base dissolves into the page.
    baseY = fadeH > 0 ? nightH + Math.min(fadeH * 0.3, 96) : h + 4;

    for (const c of [canvas!, tree]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    sprites = {
      star: makeSprite('star', colors.star, colors.glow, dpr),
      moon: makeSprite('moon', colors.star, colors.glow, dpr),
    };

    const small = w < CONFIG.ornaments.mobileBelow;
    const rand = mulberry32(CONFIG.seed);
    segments = buildTree(w, nightH, baseY, small, rand);
    ornaments = placeOrnaments(small, rand);

    // Repaint the cached tree up to the current point in the growth.
    treeCtx.setTransform(1, 0, 0, 1, 0, 0);
    treeCtx.clearRect(0, 0, tree.width, tree.height);
    for (const s of segments) s.drawn = 0;
    paintTree();
    return true;
  }

  function placeOrnaments(small: boolean, rand: () => number): Ornament[] {
    const count = small ? CONFIG.ornaments.mobile : CONFIG.ornaments.desktop;
    const between = ([a, b]: Range) => lerp(a, b, rand());

    // Keep ornaments off the bio text and out of the fade band.
    const heroRect = hero.getBoundingClientRect();
    const t = text?.getBoundingClientRect();
    const avoid = t && {
      left: t.left - heroRect.left - 16,
      right: t.right - heroRect.left + 16,
      top: t.top - heroRect.top - 16,
      bottom: t.bottom - heroRect.top + 16,
    };
    const candidates = segments.filter((s) => s.depth >= 4);
    const anchors: { x: number; y: number }[] = [];
    for (let tries = 0; anchors.length < count && tries < count * 40; tries++) {
      const s = candidates[Math.floor(rand() * candidates.length)];
      if (!s) break;
      const k = lerp(0.35, 1, rand());
      const x = lerp(s.x0, s.x1, k);
      const y = lerp(s.y0, s.y1, k);
      const maxThread = CONFIG.threadLength[1] + 16;
      if (x < 12 || x > w - 12 || y < 8 || y + maxThread > nightH - 8) continue;
      if (avoid && x > avoid.left && x < avoid.right && y + maxThread > avoid.top && y < avoid.bottom) continue;
      anchors.push({ x, y });
    }

    return anchors.map(({ x, y }) => {
      const moon = rand() < CONFIG.moonShare;
      const thread = between(CONFIG.threadLength);
      return {
        sprite: (moon ? sprites!.moon : sprites!.star).canvas,
        size: between(moon ? CONFIG.moonSize : CONFIG.starSize),
        thread,
        ax: x,
        ay: y,
        sx: x + (rand() - 0.5) * 180,
        sy: -thread - 24 - rand() * 140,
        delay: rand() * CONFIG.dropStagger,
        dur: between(CONFIG.dropMs),
        phase: rand() * Math.PI * 2,
        sway: lerp(18, 42, rand()),
      };
    });
  }

  // Paint new growth onto the cached tree canvas, segment by segment.
  function paintTree() {
    treeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    treeCtx.strokeStyle = colors.tree;
    treeCtx.lineCap = 'round';
    for (const s of segments) {
      const target = Math.min(Math.max((clock - s.start) / s.dur, 0), 1);
      if (target <= s.drawn) continue;
      treeCtx.lineWidth = s.width;
      treeCtx.beginPath();
      treeCtx.moveTo(lerp(s.x0, s.x1, s.drawn), lerp(s.y0, s.y1, s.drawn));
      treeCtx.lineTo(lerp(s.x0, s.x1, target), lerp(s.y0, s.y1, target));
      treeCtx.stroke();
      s.drawn = target;
    }
  }

  function render() {
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    ctx!.drawImage(tree, 0, 0);

    // Dissolve the trunk's base into the fade band.
    if (baseY > nightH) {
      const g = ctx!.createLinearGradient(0, (nightH - 24) * dpr, 0, baseY * dpr);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx!.globalCompositeOperation = 'destination-out';
      ctx!.fillStyle = g;
      ctx!.fillRect(0, (nightH - 24) * dpr, canvas!.width, canvas!.height);
      ctx!.globalCompositeOperation = 'source-over';
    }

    if (!growDone()) return;
    const t0 = dropClock();
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.strokeStyle = colors.thread;
    ctx!.lineWidth = 0.75;

    for (const o of ornaments) {
      const local = t0 - o.delay;
      if (local <= 0) continue;
      const p = Math.min(local / o.dur, 1);
      const e = easeOutQuart(p);

      // The thread's top drifts in with a sway that fades as it reaches the branch.
      const swayFade = 1 - easeOutCubic(p);
      const hx = lerp(o.sx, o.ax, e) + Math.sin(local * 0.0021 + o.phase) * o.sway * swayFade;
      const hy = lerp(o.sy, o.ay, e);

      // Pendulum angle: swinging while moving, then a damped settle.
      const settle = p < 1 ? 1 - 0.5 * e : 0.5 * Math.exp(-(local - o.dur) / (CONFIG.settleMs / 5));
      const theta = 0.42 * Math.sin(local * 0.0042 + o.phase) * settle;

      const ox = hx + Math.sin(theta) * o.thread;
      const oy = hy + Math.cos(theta) * o.thread;

      // Thread sags slightly, more while it swings.
      const sag = 1.5 + Math.abs(theta) * 10;
      ctx!.beginPath();
      ctx!.moveTo(hx, hy);
      ctx!.quadraticCurveTo((hx + ox) / 2 - Math.cos(theta) * sag, (hy + oy) / 2 + Math.sin(theta) * sag, ox, oy);
      ctx!.stroke();

      const box = o.size * sprites!.star.scale;
      ctx!.save();
      ctx!.translate(ox, oy + o.size / 2);
      ctx!.rotate(-theta);
      ctx!.globalAlpha = Math.min(local / 400, 1);
      ctx!.drawImage(o.sprite, -box / 2, -box / 2, box, box);
      ctx!.restore();
    }
  }

  function frame(now: number) {
    raf = 0;
    clock += Math.min(now - last, 50);
    last = now;
    if (!growDone()) paintTree();
    else if (segments.some((s) => s.drawn < 1)) {
      paintTree(); // make sure the tip of every branch is finished
    }
    render();
    if (clock >= totalMs()) {
      done = true;
      return;
    }
    schedule();
  }

  function schedule() {
    if (raf || done || !started || !inView || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function start() {
    if (started) return;
    started = true;
    if (reducedMotion) {
      // Final state, no animation: grown tree, ornaments hanging still.
      clock = totalMs();
      done = true;
      paintTree();
      render();
      return;
    }
    schedule();
  }

  new ResizeObserver(() => {
    if (layout()) render();
  }).observe(hero);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) schedule();
    else pause();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : schedule()));

  // Start only once the page content has loaded.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
