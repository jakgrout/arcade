import { Skia, type SkPath } from '@shopify/react-native-skia';

function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 1) * 10000;
  return x - Math.floor(x);
}

function addWobblyEdge(
  path: SkPath,
  x1: number, y1: number,
  x2: number, y2: number,
  seed: number,
  seedOffset: number,
  amp: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(2, Math.floor(len / 18));
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const offset = (seededRand(seed, seedOffset + i) - 0.5) * amp * 2;
    path.lineTo(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
  }
}

export function makeWobblyRect(
  x: number, y: number, w: number, h: number,
  seed: number, amp = 2.5
): SkPath {
  const path = Skia.Path.Make();
  path.moveTo(x, y);
  addWobblyEdge(path, x, y, x + w, y, seed, 0, amp);
  addWobblyEdge(path, x + w, y, x + w, y + h, seed, 20, amp);
  addWobblyEdge(path, x + w, y + h, x, y + h, seed, 40, amp);
  addWobblyEdge(path, x, y + h, x, y, seed, 60, amp);
  path.close();
  return path;
}

export function makeHatchPath(
  x: number, y: number, w: number, h: number, spacing = 8
): SkPath {
  const path = Skia.Path.Make();
  for (let i = spacing; i < w + h; i += spacing) {
    const x1 = x + Math.max(0, i - h);
    const y1 = y + Math.min(h, i);
    const x2 = x + Math.min(w, i);
    const y2 = y + Math.max(0, i - w);
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
  }
  return path;
}

export function makeWobblyOval(
  cx: number, cy: number, rx: number, ry: number, seed: number, amp = 1.2
): SkPath {
  const path = Skia.Path.Make();
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = (seededRand(seed, i) - 0.5) * amp * 2;
    const px = cx + Math.cos(angle) * (rx + wobble);
    const py = cy + Math.sin(angle) * (ry + wobble);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  return path;
}

export interface CharacterPaths {
  head: SkPath;
  body: SkPath;
  legs: SkPath;
  eyes: SkPath;
  nose: SkPath;
  mouth: SkPath;
}

export function makeCharacterPaths(
  x: number, y: number, w: number, h: number,
  seed: number, facingRight: boolean,
  frame: number, isMoving: boolean
): CharacterPaths {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  // Head — offset toward facing direction
  const hcx = cx + dir * 2.5;
  const hcy = y + h * 0.19;
  const hrx = w * 0.3;
  const hry = h * 0.17;
  const head = makeWobblyOval(hcx, hcy, hrx, hry, seed, 1.2);

  // Body
  const body = makeWobblyRect(
    x + w * 0.16, y + h * 0.38,
    w * 0.68, h * 0.34,
    seed + 10, 1.2
  );

  // Legs — walk cycle when moving
  const legTopY = y + h * 0.72;
  const swing = isMoving ? Math.sin(frame * 0.012) * 9 : 0;
  const liftL = isMoving ? Math.max(0, Math.sin(frame * 0.012)) * -6 : 0;
  const liftR = isMoving ? Math.max(0, Math.sin(frame * 0.012 + Math.PI)) * -6 : 0;
  const legs = Skia.Path.Make();
  legs.moveTo(cx - w * 0.16, legTopY);
  legs.lineTo(cx - w * 0.18 - swing * dir, y + h + liftL);
  legs.moveTo(cx + w * 0.16, legTopY);
  legs.lineTo(cx + w * 0.18 + swing * dir, y + h + liftR);

  // Eyes: near eye (front, larger) and far eye (back, smaller)
  const eyeY = hcy - hry * 0.08;
  const nearEyeX = hcx + dir * hrx * 0.42;
  const farEyeX  = hcx - dir * hrx * 0.15;
  const eyes = Skia.Path.Make();
  eyes.addCircle(nearEyeX, eyeY, 2.4);
  eyes.addCircle(farEyeX,  eyeY, 1.4);

  // Nose — small bump on facing side
  const nose = Skia.Path.Make();
  const noseX = hcx + dir * hrx * 0.52;
  nose.moveTo(noseX - dir * 2, hcy + hry * 0.05);
  nose.quadTo(noseX + dir * 4, hcy + hry * 0.2, noseX - dir * 1, hcy + hry * 0.38);

  // Mouth — shifted toward facing side
  const mouth = Skia.Path.Make();
  const mouthY = hcy + hry * 0.52;
  const mouthCx = hcx + dir * hrx * 0.1;
  mouth.moveTo(mouthCx - hrx * 0.28, mouthY);
  mouth.quadTo(mouthCx, mouthY + hry * 0.28, mouthCx + hrx * 0.28, mouthY);

  return { head, body, legs, eyes, nose, mouth };
}

// ── Background scenery (top of level) ────────────────────────────────────

// Cloud: flat bottom, bumpy top, single closed outline
function makeCloud(cx: number, baseY: number, w: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const hw = w / 2;
  const bumpCount = 3 + Math.floor(seededRand(seed, 0) * 2);

  // Bottom-left corner
  path.moveTo(cx - hw + (seededRand(seed, 1) - 0.5) * 4, baseY);
  // Bottom edge
  path.lineTo(cx + hw + (seededRand(seed, 2) - 0.5) * 4, baseY + (seededRand(seed, 3) - 0.5) * 3);
  // Right side up to top level
  const topBase = baseY - w * 0.18;
  path.lineTo(cx + hw + (seededRand(seed, 4) - 0.5) * 3, topBase);

  // Bumpy top, right → left
  for (let i = bumpCount; i >= 0; i--) {
    const bx = cx - hw + (i / bumpCount) * w;
    const valley = topBase + (seededRand(seed, i + 10) - 0.5) * 5;
    if (i < bumpCount) {
      const peakX = bx + (w / bumpCount) / 2 + (seededRand(seed, i + 20) - 0.5) * 10;
      const peakY = baseY - w * (0.22 + seededRand(seed, i + 30) * 0.14);
      path.lineTo(peakX, peakY);
    }
    path.lineTo(bx + (seededRand(seed, i + 40) - 0.5) * 4, valley);
  }
  path.close();
  return path;
}

// Tree: wobbly trunk + round leafy crown
function makeTree(cx: number, baseY: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const trunkH = 38 + seededRand(seed, 0) * 22;
  const trunkW = 7 + seededRand(seed, 1) * 4;
  const crownR = 28 + seededRand(seed, 2) * 16;
  const trunkTop = baseY - trunkH;

  // Trunk — two wobbly lines
  path.moveTo(cx - trunkW / 2 + (seededRand(seed, 3) - 0.5) * 3, baseY);
  path.lineTo(cx - trunkW / 2 + (seededRand(seed, 4) - 0.5) * 4, trunkTop + (seededRand(seed, 5) - 0.5) * 5);
  path.moveTo(cx + trunkW / 2 + (seededRand(seed, 6) - 0.5) * 3, baseY);
  path.lineTo(cx + trunkW / 2 + (seededRand(seed, 7) - 0.5) * 4, trunkTop + (seededRand(seed, 8) - 0.5) * 5);

  // Crown — wobbly oval
  const crownCy = trunkTop - crownR * 0.7;
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = (seededRand(seed, i + 50) - 0.5) * 6;
    const px = cx + Math.cos(angle) * (crownR + wobble);
    const py = crownCy + Math.sin(angle) * (crownR * 0.85 + wobble * 0.6);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  return path;
}

// Sun: wobbly circle + hand-drawn rays
function makeSun(cx: number, cy: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const r = 24 + seededRand(seed, 0) * 10;

  // Circle
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = (seededRand(seed, i) - 0.5) * 3;
    const px = cx + Math.cos(angle) * (r + wobble);
    const py = cy + Math.sin(angle) * (r + wobble);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();

  // Rays — 8 slightly irregular lines
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + seededRand(seed, i + 100) * 0.15;
    const inner = r + 5;
    const outer = r + 14 + seededRand(seed, i + 110) * 8;
    const wobble = (seededRand(seed, i + 120) - 0.5) * 4;
    path.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    path.lineTo(cx + Math.cos(angle) * outer + wobble, cy + Math.sin(angle) * outer + wobble);
  }
  return path;
}

// Bird: simple hand-drawn M/V shape (two curved strokes)
function makeBird(cx: number, cy: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const w = 14 + seededRand(seed, 0) * 8;
  const dip = 4 + seededRand(seed, 1) * 3;
  // left wing
  path.moveTo(cx, cy + (seededRand(seed, 2) - 0.5) * 2);
  path.quadTo(
    cx - w * 0.45 + (seededRand(seed, 3) - 0.5) * 3,
    cy - dip + (seededRand(seed, 4) - 0.5) * 2,
    cx - w + (seededRand(seed, 5) - 0.5) * 4,
    cy + (seededRand(seed, 6) - 0.5) * 3
  );
  // right wing
  path.moveTo(cx, cy + (seededRand(seed, 7) - 0.5) * 2);
  path.quadTo(
    cx + w * 0.45 + (seededRand(seed, 8) - 0.5) * 3,
    cy - dip + (seededRand(seed, 9) - 0.5) * 2,
    cx + w + (seededRand(seed, 10) - 0.5) * 4,
    cy + (seededRand(seed, 11) - 0.5) * 3
  );
  return path;
}

export interface Decoration {
  path: SkPath;
  color: string;
  strokeWidth: number;
  fill?: string;
}

// Places large hand-drawn scenery across the top of the level.
// All elements sit above y=165 so they never overlap platforms.
export function makeNotebookDecorations(
  _platforms: { x: number; y: number; width: number; height: number }[],
  _levelWidth: number,
  _levelHeight: number
): Decoration[] {
  const ink = '#3a3020';
  const lightFill = '#ede6d3';
  const decs: Decoration[] = [];

  // Sun — top-left, early in the level
  decs.push({ path: makeSun(130, 72, 1), color: ink, strokeWidth: 1.8 });

  // Clouds spread across the level
  const clouds: [number, number, number, number][] = [
    [360, 90, 110, 10],
    [780, 65, 130, 20],
    [1180, 85, 100, 30],
    [1580, 70, 120, 40],
    [1880, 88, 95, 50],
  ];
  for (const [cx, y, w, seed] of clouds) {
    decs.push({ path: makeCloud(cx, y, w, seed), color: ink, strokeWidth: 1.6, fill: lightFill });
  }

  // Trees — spread out, bases at y=165 so they sit just above the highest platform
  const trees: [number, number, number][] = [
    [240, 165, 100],
    [560, 165, 200],
    [960, 165, 300],
    [1380, 165, 400],
    [1720, 165, 500],
    [1960, 165, 600],
  ];
  for (const [cx, baseY, seed] of trees) {
    decs.push({ path: makeTree(cx, baseY, seed), color: ink, strokeWidth: 1.8 });
  }

  // Birds — small clusters at the top
  const birds: [number, number, number][] = [
    [490, 44, 700], [550, 36, 710], [610, 50, 720],
    [1050, 40, 730], [1110, 52, 740],
    [1500, 38, 750], [1560, 46, 760],
  ];
  for (const [cx, cy, seed] of birds) {
    decs.push({ path: makeBird(cx, cy, seed), color: ink, strokeWidth: 1.5 });
  }

  return decs;
}

// Ruled notebook lines for the background
export function makeRuledLines(w: number, h: number, spacing = 28): SkPath {
  const path = Skia.Path.Make();
  for (let y = spacing; y < h; y += spacing) {
    path.moveTo(0, y);
    path.lineTo(w, y);
  }
  return path;
}
