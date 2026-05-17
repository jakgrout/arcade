import { Component, Suspense, lazy, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f4eedf', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#c00', fontSize: 14, fontFamily: 'monospace' }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const GameScreen = lazy(async () => {
  if (Platform.OS === 'web') {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
    await LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
  }
  return import('./src/screens/GameScreen');
});

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#f5f0e8' }} />}>
        <GameScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
