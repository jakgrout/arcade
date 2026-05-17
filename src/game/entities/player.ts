import type { Body } from '../engine/physics';

export interface Player {
  body: Body;
}

const JUMP_VELOCITY = -0.72;
const MOVE_SPEED = 0.22;

export function createPlayer(x: number, y: number): Player {
  return {
    body: {
      pos: { x, y },
      vel: { x: 0, y: 0 },
      width: 32,
      height: 48,
      onGround: false,
    },
  };
}

export function movePlayer(player: Player, direction: -1 | 0 | 1): Player {
  return {
    ...player,
    body: { ...player.body, vel: { ...player.body.vel, x: direction * MOVE_SPEED } },
  };
}

export function jumpPlayer(player: Player): Player {
  if (!player.body.onGround) return player;
  return {
    ...player,
    body: { ...player.body, vel: { ...player.body.vel, y: JUMP_VELOCITY } },
  };
}
