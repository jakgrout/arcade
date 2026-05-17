import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    import('@shopify/react-native-skia/lib/module/web').then(({ LoadSkiaWeb }) =>
      LoadSkiaWeb().then(() => setReady(true))
    );
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#f5f0e8' }} />;
  return <GameScreen />;
}
