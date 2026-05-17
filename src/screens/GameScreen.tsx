import { Canvas, Group, Path, Rect } from '@shopify/react-native-skia';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { useGameLoop } from '../game/engine/gameLoop';
import { stepBody } from '../game/engine/physics';
import { createPlayer, jumpPlayer, movePlayer, type Player } from '../game/entities/player';
import { level1 } from '../game/levels/level1';
import {
  makeCharacterPaths,
  makeHatchPath,
  makeNotebookDecorations,
  makeRuledLines,
  makeWobblyRect,
} from '../game/rendering/sketch';

const CONTROLS_H = 100;

function useLevelPaths() {
  return useMemo(() => {
    const { Skia } = require('@shopify/react-native-skia');
    const margin = Skia.Path.Make();
    margin.moveTo(52, 0);
    margin.lineTo(52, level1.height);
    return {
    ruled: makeRuledLines(level1.width, level1.height),
    margin,
    platforms: level1.platforms.map((p, i) => ({
      fill:    makeWobblyRect(p.x, p.y, p.width, p.height, i * 137 + 1,  1.5),
      outline: makeWobblyRect(p.x, p.y, p.width, p.height, i * 137 + 50, 2.5),
      shadow:  makeWobblyRect(p.x + 3, p.y + 3, p.width, p.height, i * 137 + 99, 1),
      hatch:   makeHatchPath(p.x, p.y, p.width, p.height),
    })),
    decorations: makeNotebookDecorations(level1.platforms, level1.width, level1.height),
  }; }, []);
}

export default function GameScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const canvasH = screenH - CONTROLS_H;

  const playerRef = useRef<Player>(createPlayer(level1.playerStart.x, level1.playerStart.y));
  const inputRef  = useRef<{ dir: -1 | 0 | 1; jump: boolean }>({ dir: 0, jump: false });
  const frameRef  = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef(true);
  const [, forceUpdate] = useState(0);
  const levelPaths = useLevelPaths();

  useGameLoop((deltaMs) => {
    frameRef.current += deltaMs;
    const { dir, jump } = inputRef.current;

    let p = playerRef.current;
    if (dir !== 0) facingRef.current = dir > 0;

    p = movePlayer(p, dir);
    if (jump) {
      p = jumpPlayer(p);
      inputRef.current.jump = false;
    }
    p = { ...p, body: stepBody(p.body, level1.platforms, deltaMs) };
    playerRef.current = p;

    const { pos } = p.body;
    const targetX = Math.max(0, Math.min(pos.x - screenW * 0.4, level1.width - screenW));
    const targetY = Math.max(0, Math.min(pos.y - canvasH * 0.5, level1.height - canvasH));
    const f = Math.min(deltaMs * 0.007, 1);
    cameraRef.current.x += (targetX - cameraRef.current.x) * f;
    cameraRef.current.y += (targetY - cameraRef.current.y) * f;

    forceUpdate((n) => n + 1);
  });

  const { pos, width: pw, height: ph } = playerRef.current.body;
  const cam = cameraRef.current;
  const frame = frameRef.current;
  const isMoving = inputRef.current.dir !== 0;
  const charSeed = Math.floor(frame / 120) % 80;
  const char = makeCharacterPaths(pos.x, pos.y, pw, ph, charSeed, facingRef.current, frame, isMoving);

  return (
    <View style={styles.container}>
      <Canvas style={{ width: '100%', height: canvasH }}>
        <Group transform={[{ translateX: -cam.x }, { translateY: -cam.y }]}>
          {/* Paper */}
          <Rect x={0} y={0} width={level1.width} height={level1.height} color="#f4eedf" />

          {/* Ruled lines */}
          <Path path={levelPaths.ruled} color="#d4c9b0" style="stroke" strokeWidth={0.6} />

          {/* Left margin */}
          <Path path={levelPaths.margin} color="#e8a0a0" style="stroke" strokeWidth={1} />

          {/* Background scenery */}
          {levelPaths.decorations.map((dec, i) => (
            <Group key={i} opacity={0.6}>
              {dec.fill && <Path path={dec.path} color={dec.fill} />}
              <Path path={dec.path} color={dec.color} style="stroke"
                strokeWidth={dec.strokeWidth} strokeCap="round" strokeJoin="round" />
            </Group>
          ))}

          {/* Platforms */}
          {levelPaths.platforms.map(({ fill, outline, shadow, hatch }, i) => (
            <Group key={i}>
              <Path path={shadow}  color="rgba(0,0,0,0.07)" />
              <Path path={fill}    color="#e8e0ce" />
              <Path path={hatch}   color="#c8bfad" style="stroke" strokeWidth={0.7} />
              <Path path={outline} color="#3a3020" style="stroke" strokeWidth={2.5}
                strokeCap="round" strokeJoin="round" />
            </Group>
          ))}

          {/* Character */}
          <Group>
            <Path path={char.body}  color="#d8d0be" />
            <Path path={char.body}  color="#1a1510" style="stroke" strokeWidth={2}   strokeCap="round" strokeJoin="round" />
            <Path path={char.head}  color="#e8dfc8" />
            <Path path={char.head}  color="#1a1510" style="stroke" strokeWidth={2}   strokeCap="round" strokeJoin="round" />
            <Path path={char.legs}  color="#1a1510" style="stroke" strokeWidth={2.5} strokeCap="round" />
            <Path path={char.eyes}  color="#1a1510" />
            <Path path={char.nose}  color="#1a1510" style="stroke" strokeWidth={1.5} strokeCap="round" />
            <Path path={char.mouth} color="#1a1510" style="stroke" strokeWidth={1.5} strokeCap="round" />
          </Group>
        </Group>
      </Canvas>

      <View style={styles.controls}>
        <View style={styles.dpad}>
          <TouchableOpacity style={styles.btn}
            onPressIn={() => { inputRef.current.dir = -1; }}
            onPressOut={() => { inputRef.current.dir = 0; }}>
            <Text style={styles.btnText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn}
            onPressIn={() => { inputRef.current.dir = 1; }}
            onPressOut={() => { inputRef.current.dir = 0; }}>
            <Text style={styles.btnText}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.btn, styles.jumpBtn]}
          onPressIn={() => { inputRef.current.jump = true; }}>
          <Text style={styles.btnText}>▲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4eedf' },
  controls: {
    height: CONTROLS_H,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ece5d3',
    borderTopWidth: 2,
    borderTopColor: '#3a3020',
  },
  dpad:    { flexDirection: 'row', gap: 12 },
  btn: {
    width: 64, height: 64,
    borderWidth: 2, borderColor: '#3a3020', borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f4eedf',
  },
  jumpBtn: { width: 64 },
  btnText: { fontSize: 22, color: '#3a3020' },
});
