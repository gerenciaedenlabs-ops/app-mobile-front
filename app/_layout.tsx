import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
  NunitoSans_900Black,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
import { type Href, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHeartsSync } from '@/hooks/useHearts';
import { configurePurchases, syncPurchasesUser } from '@/lib/purchases';
import { useAuthStore } from '@/store/authStore';
import {
  hydrateProgressForUser,
  unloadProgressUser,
  useProgressStore,
} from '@/store/progressStore';
import { useThemeColors, useThemeStore } from '@/store/themeStore';

import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentSegment = segments[0] as string | undefined;
  const authHasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useProgressStore((state) => state.hasHydrated);
  const darkMode = useThemeStore((state) => state.darkMode);
  const colors = useThemeColors();
  // Las clases `font-*` apuntan a estas familias (ver tailwind.config.js). En
  // iOS usar una familia no cargada rompe el render, así que esperamos a que
  // estén listas; si fallaran, seguimos para no bloquear la app.
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
    NunitoSans_900Black,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  // Pone al día los corazones al abrir y al volver a primer plano.
  useHeartsSync();

  useEffect(() => {
    // Sin esto el audio no suena en iOS con el interruptor de silencio activado.
    void setAudioModeAsync({ playsInSilentMode: true });
    // Inicializa RevenueCat con nivel VERBOSE y llaves por plataforma
    configurePurchases();
  }, []);

  useEffect(() => {
    // El Stack no se monta hasta tener fuentes: sin él no se puede navegar.
    if (!authHasHydrated || !fontsReady) return;
    let cancelled = false;

    // Sincroniza usuario con RevenueCat
    void syncPurchasesUser(user?.id ?? null);

    if (!user) {
      unloadProgressUser();
      if (currentSegment !== 'login') router.replace('/login' as Href);
      return;
    }

    void hydrateProgressForUser(user.id, token).then(() => {
      if (!cancelled && currentSegment === 'login') router.replace('/');
    });

    return () => {
      cancelled = true;
    };
  }, [authHasHydrated, fontsReady, user, token, router, currentSegment]);

  // TODO(OneSignal): inicializar el SDK aquí y pedir permiso de notificaciones
  // tras la primera lección completada, no en el arranque en frío.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        {fontsReady && authHasHydrated && (!user || hasHydrated) ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surfaceSunken } }}>
            <Stack.Screen name="login" options={{ gestureEnabled: false }} />
            <Stack.Screen name="index" />
            <Stack.Screen name="learn/[instrumentId]" />
            <Stack.Screen name="lesson/[lessonId]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="lesson/result" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/index" />
            <Stack.Screen name="development/voice/index" />
            <Stack.Screen name="development/voice/level" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/voice/tuner" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/guitar/index" />
            <Stack.Screen name="development/guitar/target" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/guitar/tuner" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/drums/index" />
            <Stack.Screen name="development/drums/detector" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/drums/rhythm" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/piano/index" />
            <Stack.Screen name="development/piano/target" options={{ gestureEnabled: false }} />
            <Stack.Screen name="development/piano/detector" options={{ gestureEnabled: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        ) : (
          <View className="flex-1 items-center justify-center bg-surface-sunken">
            <Image
              source={require('@/assets/brand/app-icon.png')}
              accessibilityLabel="Ritmo"
              style={{ width: 112, height: 109 }}
              resizeMode="contain"
            />
            <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 32 }} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
