import { Redirect, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const TESTS = [
  {
    id: 'level',
    icon: '🎯',
    title: 'Prueba de nivel',
    description: 'Canta SOL durante 2 segundos y recibe una evaluación final.',
    route: '/development/voice/level' as const,
  },
  {
    id: 'tuner',
    icon: '🎚️',
    title: 'Afinador libre',
    description: 'Elige una nota y ajusta tu voz viendo Hz y cents continuamente.',
    route: '/development/voice/tuner' as const,
  },
];

export default function VoiceDevelopmentMenuScreen() {
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
          <Text className="text-xl font-extrabold text-ink">Motor de Voz</Text>
          <Text className="text-xs text-ink-muted">Selecciona una modalidad de prueba</Text>
        </View>
      </View>

      <Text className="mt-5 text-3xl font-extrabold text-ink">¿Qué quieres probar?</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">
        Ambas opciones usan el mismo motor de frecuencia fundamental, pero tienen objetivos distintos.
      </Text>

      <View className="mt-6 gap-4">
        {TESTS.map((test) => (
          <Pressable
            key={test.id}
            accessibilityRole="button"
            accessibilityLabel={test.title}
            onPress={() => router.push(test.route)}
            className="rounded-3xl border-2 border-slate-200 bg-white p-5 active:bg-surface-sunken"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100">
              <Text className="text-3xl">{test.icon}</Text>
            </View>
            <Text className="mt-4 text-xl font-extrabold text-ink">{test.title}</Text>
            <Text className="mt-1 text-sm leading-5 text-ink-muted">{test.description}</Text>
            <Text className="mt-4 text-sm font-extrabold text-cyan-700">ABRIR PRUEBA →</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
