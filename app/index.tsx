import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { HeartsBar } from '@/components/HeartsBar';
import { Screen } from '@/components/Screen';
import { StatPill } from '@/components/StatPill';
import { getCurriculum, getInstruments } from '@/content';
import { InstrumentCard } from '@/features/instruments/InstrumentCard';
import { todayKey } from '@/lib/datetime';
import { getEffectiveStreak } from '@/lib/streak';
import { countCompleted } from '@/lib/unlock';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';
import type { InstrumentId } from '@/types/content';

export default function InstrumentSelectorScreen() {
  const router = useRouter();

  const xp = useProgressStore((state) => state.xp);
  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);
  const setLastInstrument = useProgressStore((state) => state.setLastInstrument);
  const completed = useCompletedLessonIds();

  const instruments = getInstruments();
  const effectiveStreak = getEffectiveStreak(streak, todayKey());

  const openInstrument = (instrumentId: InstrumentId) => {
    setLastInstrument(instrumentId);
    if (instrumentId === 'voice') {
      router.push('/voice-pitch-test');
      return;
    }
    router.push(`/learn/${instrumentId}`);
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-2">
          <StatPill icon="🔥" value={effectiveStreak} label="Racha" />
          <StatPill icon="⚡" value={xp} label="XP" />
        </View>

        <View className="flex-row items-center gap-2">
          <HeartsBar current={hearts.current} max={hearts.max} compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={() => router.push('/profile')}
            className="h-9 w-9 items-center justify-center rounded-full bg-white active:bg-slate-200"
          >
            <Text className="text-base">👤</Text>
          </Pressable>
        </View>
      </View>

      <Text className="mt-6 text-3xl font-extrabold text-ink">¿Qué practicamos hoy?</Text>
      <Text className="mt-1 text-sm text-ink-muted">
        Elige un instrumento. Puedes cambiar cuando quieras.
      </Text>

      <View className="mt-6 gap-4">
        {[0, 2].map((rowStart) => (
          <View key={rowStart} className="flex-row gap-4">
            {instruments.slice(rowStart, rowStart + 2).map((instrument) => {
              const curriculum = getCurriculum(instrument.id);
              const total = curriculum.reduce((sum, entry) => sum + entry.lessons.length, 0);

              return (
                <InstrumentCard
                  key={instrument.id}
                  instrument={instrument}
                  completedLessons={countCompleted(curriculum, completed)}
                  totalLessons={total}
                  previewAvailable={instrument.id === 'voice'}
                  onPress={() => openInstrument(instrument.id)}
                />
              );
            })}
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver EdenShip Premium"
        onPress={() => router.push('/paywall')}
        className="mt-8 flex-row items-center gap-3 rounded-2xl bg-ink p-4 active:opacity-90"
      >
        <Text className="text-2xl">👑</Text>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-white">EdenShip Premium</Text>
          <Text className="text-xs text-white/70">Vidas infinitas y todas las unidades</Text>
        </View>
        <Text className="text-white/70">›</Text>
      </Pressable>
    </Screen>
  );
}
