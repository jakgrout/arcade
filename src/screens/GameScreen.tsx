import { Canvas, Group, Line, Path, Rect, vec } from '@shopify/react-native-skia';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useGameLoop } from '../game/engine/gameLoop';
import { stepBody } from '../game/engine/physics';
import { createPlayer, jumpPlayer, movePlayer, type Player } from '../game/entities/player';
import { level1 } from '../game/levels/level1';
import { makeHatchPath, makeRuledLines, makeWobblyRect } from '../game/rendering/sketch';

// Pre-compute stable paths for static elements
function useLevelPaths() {
  return useMemo(() => ({
    ruled: makeRuledLines(level1.width, level1.height),
    platforms: level1.platforms.map((p, i) => ({
      fill: makeWobblyRect(p.x, p.y, p.width, p.height, i * 137 + 1, 1.5),
      outline: makeWobblyRect(p.x, p.y, p.width, p.height, i * 137 + 50, 2.5),
      shadow: makeWobblyRect(p.x + 3, p.y + 3, p.width, p.height, i * 137 + 99, 1),
      hatch: makeHatchPath(p.x, p.y, p.width, p.height),
    })),
  }), []);
}

export default function GameScreen() {
  const playerRef = useRef<Player>(createPlayer(level1.playerStart.x, level1.playerStart.y));
  const inputRef = useRef<{ dir: -1 | 0 | 1; jump: boolean }>({ dir: 0, jump: false });
  const frameRef = useRef(0);
  const [, forceUpdate] = useState(0);
  const levelPaths = useLevelPaths();

  useGameLoop((deltaMs) => {
    frameRef.current += deltaMs;
    let p = playerRef.current;
    const { dir, jump } = inputRef.current;

    p = movePlayer(p, dir);
    if (jump) {
      p = jumpPlayer(p);
      inputRef.current.jump = false;
    }
    p = { ...p, body: stepBody(p.body, level1.platforms, deltaMs) };
    playerRef.current = p;
    forceUpdate((n) => n + 1);
  });

  const { pos, width: pw, height: ph } = playerRef.current.body;

  // Player path gets a slow-changing seed so the sketch "breathes" slightly
  const playerSeed = Math.floor(frameRef.current / 120) % 80;
  const playerOutline = makeWobblyRect(pos.x, pos.y, pw, ph, playerSeed, 1.5);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Paper background */}
        <Rect x={0} y={0} width={level1.width} height={level1.height} color="#f4eedf" />

        {/* Notebook ruled lines */}
        <Path path={levelPaths.ruled} color="#d4c9b0" style="stroke" strokeWidth={0.6} />

        {/* Left margin line */}
        <Line p1={vec(52, 0)} p2={vec(52, level1.height)} color="#e8a0a0" strokeWidth={1} />

        {/* Platforms */}
        {levelPaths.platforms.map(({ fill, outline, shadow, hatch }, i) => (
          <Group key={i}>
            {/* Drop shadow */}
            <Path path={shadow} color="rgba(0,0,0,0.08)" />
            {/* Fill */}
            <Path path={fill} color="#e8e0ce" />
            {/* Hatch marks */}
            <Path path={hatch} color="#c8bfad" style="stroke" strokeWidth={0.7} />
            {/* Outline — drawn twice with slight offset for thick sketch feel */}
            <Path path={outline} color="#3a3020" style="stroke" strokeWidth={2.5} strokeCap="round" strokeJoin="round" />
          </Group>
        ))}

        {/* Player */}
        <Group>
          {/* Inner fill so player reads clearly */}
          <Path path={playerOutline} color="#d4cfc5" />
          {/* Sketch outline */}
          <Path
            path={playerOutline}
            color="#1a1510"
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            strokeJoin="round"
          />
        </Group>
      </Canvas>

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
  container: { flex: 1, backgroundColor: '#f4eedf' },
  canvas: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#ece5d3',
    borderTopWidth: 2,
    borderTopColor: '#3a3020',
  },
  dpad: { flexDirection: 'row', gap: 12 },
  btn: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#3a3020',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4eedf',
  },
  jumpBtn: { width: 64 },
  btnText: { fontSize: 22, color: '#3a3020' },
});
