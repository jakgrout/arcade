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

// ── Notebook decorations ──────────────────────────────────────────────────

function makeStar(cx: number, cy: number, r: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const inner = r * 0.42;
  const points = 5;
  for (let i = 0; i <= points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    const wobble = (seededRand(seed, i + 100) - 0.5) * r * 0.2;
    const px = cx + Math.cos(angle) * (radius + wobble);
    const py = cy + Math.sin(angle) * (radius + wobble);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  return path;
}

function makeSpiral(cx: number, cy: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * 2.5 * Math.PI * 2;
    const r = t * 11 + 2;
    const wobble = (seededRand(seed, i + 200) - 0.5) * 1.8;
    const px = cx + Math.cos(angle) * (r + wobble);
    const py = cy + Math.sin(angle) * (r + wobble);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  return path;
}

function makeArrow(x: number, y: number, right: boolean, seed: number): SkPath {
  const path = Skia.Path.Make();
  const d = right ? 1 : -1;
  const len = 22 + seededRand(seed, 300) * 8;
  // shaft with slight wobble
  const midY = y + (seededRand(seed, 301) - 0.5) * 3;
  path.moveTo(x, y + (seededRand(seed, 302) - 0.5) * 2);
  path.lineTo(x + d * len * 0.5, midY);
  path.lineTo(x + d * len, y + (seededRand(seed, 303) - 0.5) * 2);
  // arrowhead
  path.moveTo(x + d * len, y);
  path.lineTo(x + d * (len - 9), y - 6 + (seededRand(seed, 304) - 0.5) * 2);
  path.moveTo(x + d * len, y);
  path.lineTo(x + d * (len - 9), y + 6 + (seededRand(seed, 305) - 0.5) * 2);
  return path;
}

function makeScribbleX(cx: number, cy: number, r: number, seed: number): SkPath {
  const path = Skia.Path.Make();
  const w = (seededRand(seed, 400) - 0.5) * 2;
  path.moveTo(cx - r + (seededRand(seed, 401) - 0.5) * w, cy - r);
  path.lineTo(cx + r + (seededRand(seed, 402) - 0.5) * w, cy + r);
  path.moveTo(cx + r + (seededRand(seed, 403) - 0.5) * w, cy - r);
  path.lineTo(cx - r + (seededRand(seed, 404) - 0.5) * w, cy + r);
  return path;
}

export interface Decoration {
  path: SkPath;
  color: string;
  strokeWidth: number;
  filled: boolean;
}

// Generates deliberate notebook-style annotations tied to the level layout.
// Each decoration has a clear reason for being where it is.
export function makeNotebookDecorations(
  platforms: { x: number; y: number; width: number; height: number }[],
  _levelWidth: number,
  _levelHeight: number
): Decoration[] {
  const decs: Decoration[] = [];
  const darkInk = '#3a3020';
  const blueInk = '#2a3a5a';
  const redInk  = '#5a2020';

  platforms.forEach((p, i) => {
    if (i === 0) return; // skip ground
    const seed = i * 713;
    const cx = p.x + p.width / 2;

    // Small star centered above every platform — marks it as a landing spot
    decs.push({
      path: makeStar(cx, p.y - 18, 7, seed),
      color: i === platforms.length - 1 ? redInk : darkInk,
      strokeWidth: 1.4, filled: false,
    });

    // Right-pointing arrow just before the first three platforms — guides the player
    if (i <= 3) {
      decs.push({
        path: makeArrow(p.x - 52, p.y - 6, true, seed + 1),
        color: blueInk, strokeWidth: 1.4, filled: false,
      });
    }

    // Spiral in the right margin of every other platform — pure doodle, stays out of the way
    if (i % 2 === 1) {
      decs.push({
        path: makeSpiral(p.x + p.width + 20, p.y + p.height / 2, seed + 2),
        color: darkInk, strokeWidth: 1.1, filled: false,
      });
    }

    // X-mark on the far side of every other platform — like a treasure-map notation
    if (i % 2 === 0) {
      decs.push({
        path: makeScribbleX(p.x + p.width + 16, p.y + p.height / 2, 6, seed + 3),
        color: redInk, strokeWidth: 1.4, filled: false,
      });
    }
  });

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
