import { useFrameCallback } from 'react-native-reanimated';

export type UpdateFn = (deltaMs: number) => void;

export function useGameLoop(update: UpdateFn) {
  useFrameCallback((info) => {
    const delta = info.timeSincePreviousFrame ?? 16;
    update(delta);
  });
}
