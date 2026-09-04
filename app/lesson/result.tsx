import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { HeartsBar } from '@/components/HeartsBar';
import { Screen } from '@/components/Screen';
import { getLesson, getUnit } from '@/content';
import { StatTile } from '@/features/profile/StatTile';
import { todayKey } from '@/lib/datetime';
import { getEffectiveStreak, hasPracticedToday } from '@/lib/streak';
import { useProgressStore } from '@/store/progressStore';

export default function LessonResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lessonId: string;
    outcome: string;
    xp: string;
    correct: string;
    total: string;
  }>();

  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);

  const passed = params.outcome === 'passed';
  const xpEarned = Number(params.xp ?? 0);
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);

  const lesson = getLesson(params.lessonId ?? '');
  const unit = lesson ? getUnit(lesson.unitId) : undefined;
  const today = todayKey();
  const currentStreak = getEffectiveStreak(streak, today);

  const goToTree = () => {
    if (unit) router.replace(`/learn/${unit.instrumentId}`);
    else router.replace('/');
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Text className="text-7xl">{passed ? '🎉' : '💔'}</Text>
        <Text className="mt-4 text-center text-3xl font-extrabold text-ink">
          {passed ? '¡Lección completada!' : 'Te quedaste sin vidas'}
        </Text>
        <Text className="mt-2 text-center text-sm text-ink-muted">
          {lesson?.title ?? 'Lección'} · {correct} de {total} aciertos
        </Text>

        <View className="mt-8 w-full flex-row gap-3">
          <StatTile icon="⚡" value={`+${xpEarned}`} label="XP ganado" />
          <StatTile icon="🔥" value={currentStreak} label="Días de racha" />
        </View>

        <View className="mt-3 w-full flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <View>
            <Text className="text-sm font-bold text-ink">Vidas restantes</Text>
            <Text className="text-xs text-ink-muted">
              {hearts.current}/{hearts.max} · se recuperan con el tiempo
            </Text>
          </View>
          <HeartsBar current={hearts.current} max={hearts.max} />
        </View>

        {passed && hasPracticedToday(streak, today) ? (
          <Text className="mt-4 text-center text-xs font-semibold text-streak">
            🔥 Racha asegurada por hoy
          </Text>
        ) : null}
      </View>

      <View className="gap-3">
        <Button label="Seguir" onPress={goToTree} />
        {!passed ? (
          <Button
            label="Conseguir vidas ilimitadas"
            icon="👑"
            variant="secondary"
            onPress={() => router.push('/paywall')}
          />
        ) : null}
      </View>
    </Screen>
  );
}
