import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { HeartsBar } from '@/components/HeartsBar';
import { Screen } from '@/components/Screen';
import { StatPill } from '@/components/StatPill';
import { getCurriculum, getInstruments } from '@/content';
import { InstrumentCard } from '@/features/instruments/InstrumentCard';
import { todayKey } from '@/lib/datetime';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { getEffectiveStreak } from '@/lib/streak';
import { countCompleted } from '@/lib/unlock';
import { useAuthStore } from '@/store/authStore';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';
import type { InstrumentId } from '@/types/content';

export default function InstrumentSelectorScreen() {
  const router = useRouter();

  const xp = useProgressStore((state) => state.xp);
  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);
  const setLastInstrument = useProgressStore((state) => state.setLastInstrument);
  const completed = useCompletedLessonIds();
  const user = useAuthStore((state) => state.user);

  const instruments = getInstruments();
  const effectiveStreak = getEffectiveStreak(streak, todayKey());

  const openInstrument = (instrumentId: InstrumentId) => {
    setLastInstrument(instrumentId);
    router.push(`/learn/${instrumentId}`);
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between border-b border-slate-200 pb-4 pt-2">
        <View>
          <Text className="text-2xl font-extrabold text-ink">Mis cursos</Text>
          <Text className="mt-1 text-xs text-ink-muted">Hola, {user?.username}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => router.push('/profile')}
          className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white active:bg-slate-200"
        >
          <Text className="text-lg">👤</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <StatPill icon="🔥" value={effectiveStreak} label="Racha" />
        <StatPill icon="⚡" value={xp} label="XP" />
        <HeartsBar current={hearts.current} max={hearts.max} compact />
      </View>

      <Text className="mt-6 text-sm leading-5 text-ink-muted">
        Puedes llevar varios cursos a la vez. Tu racha cuenta igual en todos.
      </Text>

      <View className="mt-4 gap-3">
        {instruments.map((instrument) => {
              const curriculum = getCurriculum(instrument.id);
              const total = curriculum.reduce((sum, entry) => sum + entry.lessons.length, 0);

              return (
                <InstrumentCard
                  key={instrument.id}
                  instrument={instrument}
                  completedLessons={countCompleted(curriculum, completed)}
                  totalLessons={total}
                  onPress={() => openInstrument(instrument.id)}
                />
              );
            })}
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

      {DEVELOPMENT_SECTION_ENABLED ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir sección de desarrollo"
          onPress={() => router.push('/development')}
          className="mt-3 flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50 p-4 active:bg-cyan-100"
        >
          <Text className="text-2xl">🛠️</Text>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-cyan-800">Sección de desarrollo</Text>
            <Text className="text-xs text-cyan-700">Prueba los motores de detección</Text>
          </View>
          <Text className="text-cyan-700">›</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
