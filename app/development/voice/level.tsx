import { Redirect, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { VoicePitchChallenge } from '@/features/voice/VoicePitchChallenge';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { noteToFrequency } from '@/lib/pitch';

const TARGET = {
  name: 'G',
  octave: 4,
  frequencyHz: noteToFrequency('G', 4) ?? 391.995,
};

export default function VoiceLevelTestScreen() {
  const router = useRouter();

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-slate-200"
        >
          <Text className="text-2xl text-ink">‹</Text>
        </Pressable>
        <View className="rounded-full bg-cyan-100 px-3 py-1">
          <Text className="text-xs font-extrabold text-cyan-700">DEBUG · PRUEBA DE NIVEL</Text>
        </View>
      </View>

      <View className="mt-5">
        <VoicePitchChallenge
          target={TARGET}
          displayName="SOL"
          prompt="Canta SOL durante 2 segundos"
          hint="La barra empieza con tu voz y avanza en tiempo real hasta realizar la evaluación final."
          centsTolerance={25}
          evaluationDurationMs={2_000}
          timeoutMs={15_000}
          allowRetry
        />
      </View>
    </Screen>
  );
}
