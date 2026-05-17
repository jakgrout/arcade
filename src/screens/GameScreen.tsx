import { Canvas, Path, Skia, rect } from '@shopify/react-native-skia';
import { useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

import { useGameLoop } from '../game/engine/gameLoop';
import { stepBody } from '../game/engine/physics';
import { createPlayer, jumpPlayer, movePlayer, type Player } from '../game/entities/player';
import { level1 } from '../game/levels/level1';

export default function GameScreen() {
  const playerRef = useRef<Player>(createPlayer(level1.playerStart.x, level1.playerStart.y));
  const inputRef = useRef<{ dir: -1 | 0 | 1; jump: boolean }>({ dir: 0, jump: false });

  // Shared values drive Skia redraws
  const playerX = useSharedValue(playerRef.current.body.pos.x);
  const playerY = useSharedValue(playerRef.current.body.pos.y);

  const tick = useCallback((deltaMs: number) => {
    let p = playerRef.current;
    const { dir, jump } = inputRef.current;

    p = movePlayer(p, dir);
    if (jump) {
      p = jumpPlayer(p);
      inputRef.current.jump = false;
    }
    p = { ...p, body: stepBody(p.body, level1.platforms, deltaMs) };
    playerRef.current = p;

    playerX.value = p.body.pos.x;
    playerY.value = p.body.pos.y;
  }, [playerX, playerY]);

  useGameLoop(tick);

  const sketchyPlatformPath = (x: number, y: number, w: number, h: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x + 2, y + 2);
    path.lineTo(x + w - 2, y + 1);
    path.lineTo(x + w - 1, y + h - 1);
    path.lineTo(x + 1, y + h);
    path.close();
    return path;
  };

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Background — aged paper */}
        <Path
          path={sketchyPlatformPath(0, 0, level1.width, level1.height)}
          color="#f5f0e8"
        />

        {/* Platforms */}
        {level1.platforms.map((plat, i) => (
          <Path
            key={i}
            path={sketchyPlatformPath(plat.x, plat.y, plat.width, plat.height)}
            color="#2a2a2a"
            style="stroke"
            strokeWidth={2}
          />
        ))}

        {/* Player — simple sketched rectangle for now */}
        <Path
          path={sketchyPlatformPath(
            playerX.value,
            playerY.value,
            playerRef.current.body.width,
            playerRef.current.body.height,
          )}
          color="#1a1a1a"
          style="stroke"
          strokeWidth={2}
        />
      </Canvas>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.dpad}>
          <TouchableOpacity
            style={styles.btn}
            onPressIn={() => { inputRef.current.dir = -1; }}
            onPressOut={() => { inputRef.current.dir = 0; }}
          >
            <Text style={styles.btnText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPressIn={() => { inputRef.current.dir = 1; }}
            onPressOut={() => { inputRef.current.dir = 0; }}
          >
            <Text style={styles.btnText}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.jumpBtn]}
          onPressIn={() => { inputRef.current.jump = true; }}
        >
          <Text style={styles.btnText}>▲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0e8' },
  canvas: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#e8e2d4',
  },
  dpad: { flexDirection: 'row', gap: 12 },
  btn: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f0e8',
  },
  jumpBtn: { width: 60 },
  btnText: { fontSize: 20 },
});
