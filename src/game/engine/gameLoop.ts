import { useEffect, useRef } from 'react';

export type UpdateFn = (deltaMs: number) => void;

export function useGameLoop(update: UpdateFn) {
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    let rafId: number;
    let lastTime = 0;

    const loop = (time: number) => {
      const delta = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      updateRef.current(delta);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);
}
