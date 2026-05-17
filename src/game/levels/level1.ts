import type { Platform } from '../engine/physics';

export interface Level {
  platforms: Platform[];
  playerStart: { x: number; y: number };
  width: number;
  height: number;
}

export const level1: Level = {
  width: 800,
  height: 600,
  playerStart: { x: 80, y: 480 },
  platforms: [
    { x: 0, y: 560, width: 800, height: 40 },   // ground
    { x: 120, y: 440, width: 160, height: 16 },
    { x: 340, y: 360, width: 140, height: 16 },
    { x: 520, y: 280, width: 180, height: 16 },
    { x: 200, y: 240, width: 120, height: 16 },
  ],
};
