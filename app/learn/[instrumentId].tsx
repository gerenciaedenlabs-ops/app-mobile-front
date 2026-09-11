import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { HeartsBar } from '@/components/HeartsBar';
import { Screen } from '@/components/Screen';
import { StatPill } from '@/components/StatPill';
import { getCurriculum, getInstrument } from '@/content';
import { UnitSection } from '@/features/skill-tree/UnitSection';
import { formatDuration, todayKey } from '@/lib/datetime';
import { msUntilNextHeart } from '@/lib/hearts';
import { getEffectiveStreak } from '@/lib/streak';
import { buildTree } from '@/lib/unlock';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';
import type { Lesson } from '@/types/content';

export default function SkillTreeScreen() {
  const router = useRouter();
  const { instrumentId } = useLocalSearchParams<{ instrumentId: string }>();

  const hearts = useProgressStore((state) => state.hearts);
  const xp = useProgressStore((state) => state.xp);
  const streak = useProgressStore((state) => state.streak);
  const isPremium = useProgressStore((state) => state.isPremium);
  const completed = useCompletedLessonIds();

  const instrument = getInstrument(instrumentId ?? '');
  const curriculum = useMemo(
    () => (instrument ? getCurriculum(instrument.id) : []),
    [instrument],
  );
  const tree = useMemo(() => buildTree(curriculum, completed), [curriculum, completed]);

  if (!instrument) {
    return (
      <Screen>
        <EmptyState
          icon="🤷"
          title="Instrumento desconocido"
          description={`No existe ningún instrumento con id "${instrumentId ?? ''}".`}
          className="flex-1"
        />
      </Screen>
    );
  }

  const openLesson = (lesson: Lesson) => {
    if (lesson.isPremium && !isPremium) {
      router.push('/paywall');
      return;
    }

    if (hearts.current <= 0) {
      const remaining = msUntilNextHeart(hearts);
      Alert.alert(
        'Te quedaste sin vidas',
        remaining === null
          ? 'Espera un poco para recuperar vidas.'
          : `La próxima vida llega en ${formatDuration(remaining)}.`,
        [
          { text: 'Esperar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => router.push('/paywall') },
        ],
      );
      return;
    }

    router.push(`/lesson/${lesson.id}`);
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between border-b border-slate-200 pb-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a los instrumentos"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white active:bg-slate-200"
        >
          <Text className="text-xl text-ink-muted">‹</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <StatPill icon="🔥" value={getEffectiveStreak(streak, todayKey())} label="Racha" />
          <StatPill icon="⚡" value={xp} label="XP" />
          <HeartsBar current={hearts.current} max={hearts.max} compact />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar curso"
        onPress={() => router.back()}
        className="mb-5 mt-4 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 active:bg-surface-sunken"
      >
        <View
          style={{ backgroundColor: `${instrument.accentColor}1A` }}
          className="h-12 w-12 items-center justify-center rounded-xl"
        >
          <Text className="text-2xl">{instrument.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">Curso actual</Text>
          <Text className="mt-0.5 text-lg font-extrabold text-ink">{instrument.name}</Text>
          <Text className="text-xs text-ink-muted">{instrument.tagline}</Text>
        </View>
        <Text className="text-xl text-ink-muted">⌄</Text>
      </Pressable>

      {tree.length === 0 ? (
        <EmptyState
          icon="🚧"
          title="Aún no hay lecciones"
          description={`El contenido de ${instrument.name.toLowerCase()} está en camino.`}
        />
      ) : (
        tree.map((unitTree) => (
          <UnitSection
            key={unitTree.unit.id}
            tree={unitTree}
            accentColor={instrument.accentColor}
            onSelectLesson={openLesson}
          />
        ))
      )}
    </Screen>
  );
}
