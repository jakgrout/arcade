import type { Platform } from '../engine/physics';

export interface Level {
  platforms: Platform[];
  playerStart: { x: number; y: number };
  width: number;
  height: number;
}

// Ground at y=660; player height=48 so spawn bottom sits flush on ground
export const level1: Level = {
  width: 2000,
  height: 700,
  playerStart: { x: 100, y: 612 },
  platforms: [
    { x: 0,    y: 660, width: 2000, height: 40 }, // ground
    { x: 120,  y: 520, width: 160,  height: 16 }, // +140 from ground
    { x: 340,  y: 420, width: 140,  height: 16 }, // +100
    { x: 540,  y: 330, width: 160,  height: 16 }, // +90
    { x: 740,  y: 420, width: 120,  height: 16 }, // step back down
    { x: 920,  y: 330, width: 140,  height: 16 }, // +90
    { x: 1100, y: 250, width: 120,  height: 16 }, // +80
    { x: 1280, y: 330, width: 160,  height: 16 }, // step back down
    { x: 1460, y: 250, width: 120,  height: 16 }, // +80
    { x: 1640, y: 170, width: 140,  height: 16 }, // +80
    { x: 1800, y: 250, width: 160,  height: 16 }, // step back down
  ],
};
