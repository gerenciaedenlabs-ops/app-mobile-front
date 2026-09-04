import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHeartsSync } from '@/hooks/useHearts';
import { useProgressStore } from '@/store/progressStore';

import '../global.css';

export default function RootLayout() {
  const hasHydrated = useProgressStore((state) => state.hasHydrated);

  // Pone al día los corazones al abrir y al volver a primer plano.
  useHeartsSync();

  useEffect(() => {
    // Sin esto el audio no suena en iOS con el interruptor de silencio activado.
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // TODO(OneSignal): inicializar el SDK aquí y pedir permiso de notificaciones
  // tras la primera lección completada, no en el arranque en frío.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {hasHydrated ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F1F5F9' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="learn/[instrumentId]" />
            <Stack.Screen name="lesson/[lessonId]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="lesson/result" options={{ gestureEnabled: false }} />
            <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        ) : (
          <View className="flex-1 items-center justify-center bg-surface-sunken">
            <ActivityIndicator size="large" color="#6D28D9" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
