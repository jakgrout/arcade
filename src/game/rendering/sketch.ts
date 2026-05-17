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

// Returns a closed wobbly rectangle path. Seed must be stable across renders
// for static elements so they don't jitter.
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

// Diagonal hatch lines clipped to a rect
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

// Wobbly oval — used for character head
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
  mouth: SkPath;
}

// Draws a simple hand-drawn character at position (x,y) with given dimensions.
// seed should change slowly for a "breathing" effect; facingRight flips the face.
export function makeCharacterPaths(
  x: number, y: number, w: number, h: number,
  seed: number, facingRight: boolean
): CharacterPaths {
  const cx = x + w / 2;

  // Head
  const hcx = cx + (facingRight ? 1.5 : -1.5);
  const hcy = y + h * 0.19;
  const hrx = w * 0.3;
  const hry = h * 0.17;
  const head = makeWobblyOval(hcx, hcy, hrx, hry, seed, 1.2);

  // Body (slightly wider at shoulders, narrower at waist)
  const body = makeWobblyRect(
    x + w * 0.16, y + h * 0.38,
    w * 0.68, h * 0.34,
    seed + 10, 1.2
  );

  // Legs — two simple lines
  const legs = Skia.Path.Make();
  const legTopY = y + h * 0.72;
  // Left leg
  legs.moveTo(cx - w * 0.16, legTopY);
  legs.lineTo(cx - w * 0.22, y + h);
  // Right leg
  legs.moveTo(cx + w * 0.16, legTopY);
  legs.lineTo(cx + w * 0.22, y + h);

  // Eyes — two small filled dots
  const eyeY = hcy - hry * 0.05;
  const eyeOffX = hrx * 0.38;
  const eyes = Skia.Path.Make();
  eyes.addCircle(hcx - eyeOffX, eyeY, 1.8);
  eyes.addCircle(hcx + eyeOffX, eyeY, 1.8);

  // Mouth — small curved stroke
  const mouth = Skia.Path.Make();
  const mouthY = hcy + hry * 0.42;
  mouth.moveTo(hcx - hrx * 0.3, mouthY);
  mouth.quadTo(hcx, mouthY + hry * 0.32, hcx + hrx * 0.3, mouthY);

  return { head, body, legs, eyes, mouth };
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
