import { Suspense, lazy } from 'react';
import { Platform, View } from 'react-native';

// GameScreen must be lazy-loaded on web so that Skia.web.js
// (which reads global.CanvasKit at module evaluation time) is
// only evaluated after LoadSkiaWeb has set global.CanvasKit.
const GameScreen = lazy(async () => {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
    await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
  }
  return import('./src/screens/GameScreen');
});

export default function App() {
  return (
    <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#f5f0e8' }} />}>
      <GameScreen />
    </Suspense>
  );
}
