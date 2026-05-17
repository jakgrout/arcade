export interface Vec2 {
  x: number;
  y: number;
}

export interface Body {
  pos: Vec2;
  vel: Vec2;
  width: number;
  height: number;
  onGround: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GRAVITY = 0.0015; // units/ms²

export function stepBody(body: Body, platforms: Platform[], deltaMs: number): Body {
  const vel = { ...body.vel };
  const pos = { ...body.pos };

  vel.y += GRAVITY * deltaMs;
  pos.x += vel.x * deltaMs;
  pos.y += vel.y * deltaMs;

  let onGround = false;

  for (const plat of platforms) {
    const prevBottom = body.pos.y + body.height;
    const nextBottom = pos.y + body.height;
    const withinX = pos.x + body.width > plat.x && pos.x < plat.x + plat.width;

    if (withinX && prevBottom <= plat.y && nextBottom >= plat.y) {
      pos.y = plat.y - body.height;
      vel.y = 0;
      onGround = true;
    }
  }

  return { ...body, pos, vel, onGround };
}
