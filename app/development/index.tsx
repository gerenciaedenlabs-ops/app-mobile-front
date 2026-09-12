import { type Href, Redirect, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { getInstruments } from '@/content';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const DEVELOPMENT_ROUTES: Record<string, string> = {
  voice: '/development/voice',
  guitar: '/development/guitar',
  drums: '/development/drums',
};

export default function DevelopmentMenuScreen() {
  const router = useRouter();

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  return (
    <Screen scroll>
      <View className="flex-row items-center gap-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-slate-200"
        >
          <Text className="text-2xl text-ink">‹</Text>
        </Pressable>
        <View>
          <Text className="text-xl font-extrabold text-ink">Laboratorio de motores</Text>
          <Text className="text-xs text-ink-muted">Herramientas internas de desarrollo</Text>
        </View>
      </View>

      <Text className="mt-5 text-3xl font-extrabold text-ink">Pruebas por instrumento</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">
        Aquí se valida cada motor de forma aislada, sin progreso, XP ni resultados de lección.
      </Text>

      <View className="mt-6 gap-3">
        {getInstruments().map((instrument) => {
          const route = DEVELOPMENT_ROUTES[instrument.id];
          const available = Boolean(route);
          return (
            <Pressable
              key={instrument.id}
              accessibilityRole="button"
              accessibilityLabel={`${instrument.name}. ${available ? 'Motor disponible' : 'Motor pendiente'}`}
              accessibilityState={{ disabled: !available }}
              disabled={!available}
              onPress={() => route && router.push(route as Href)}
              className="flex-row items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 active:bg-surface-sunken disabled:opacity-50"
            >
              <View
                style={{ backgroundColor: `${instrument.accentColor}1A` }}
                className="h-14 w-14 items-center justify-center rounded-2xl"
              >
                <Text className="text-2xl">{instrument.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-ink">{instrument.name}</Text>
                <Text className="mt-0.5 text-xs text-ink-muted">{instrument.tagline}</Text>
              </View>
              <View className={available ? 'rounded-full bg-success-soft px-3 py-1' : 'rounded-full bg-slate-100 px-3 py-1'}>
                <Text className={available ? 'text-xs font-bold text-success' : 'text-xs font-bold text-ink-muted'}>
                  {available ? 'LISTO' : 'PENDIENTE'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
