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

// Ruled notebook lines for the background
export function makeRuledLines(w: number, h: number, spacing = 28): SkPath {
  const path = Skia.Path.Make();
  for (let y = spacing; y < h; y += spacing) {
    path.moveTo(0, y);
    path.lineTo(w, y);
  }
  return path;
}
