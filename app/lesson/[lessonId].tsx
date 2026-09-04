import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { getCurriculum, getLesson, getUnit } from '@/content';
import { LessonRunner } from '@/features/lesson/LessonRunner';
import { formatDuration } from '@/lib/datetime';
import { getLessonState } from '@/lib/unlock';
import { useNextHeartCountdown } from '@/hooks/useHearts';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';

export default function LessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const hearts = useProgressStore((state) => state.hearts);
  const isPremium = useProgressStore((state) => state.isPremium);
  const completed = useCompletedLessonIds();
  const remainingMs = useNextHeartCountdown();

  /**
   * Se comprueba SOLO al entrar. Si fuese reactivo, perder la última vida a
   * mitad de lección desmontaría el runner en pleno feedback y la sesión nunca
   * llegaría a la pantalla de resultado.
   */
  const [enteredWithoutHearts] = useState(() => useProgressStore.getState().hearts.current <= 0);
  const blockedByHearts = enteredWithoutHearts && hearts.current <= 0;

  const lesson = getLesson(lessonId ?? '');
  const unit = lesson ? getUnit(lesson.unitId) : undefined;

  if (!lesson || !unit) {
    return (
      <Screen>
        <EmptyState
          icon="🔍"
          title="Lección no encontrada"
          description={`No hay ninguna lección con id "${lessonId ?? ''}".`}
          className="flex-1"
        />
        <Button label="Volver" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  // El contenido de pago y las lecciones bloqueadas no se abren ni por deep link.
  if (lesson.isPremium && !isPremium) return <Redirect href="/paywall" />;

  const state = getLessonState(getCurriculum(unit.instrumentId), completed, lesson.id);
  if (state === 'locked') return <Redirect href={`/learn/${unit.instrumentId}`} />;

  if (blockedByHearts) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-6xl">💔</Text>
          <Text className="mt-2 text-2xl font-extrabold text-ink">Sin vidas</Text>
          <Text className="text-center text-sm text-ink-muted">
            {remainingMs === null
              ? 'Vuelve en un rato para seguir practicando.'
              : `La próxima vida llega en ${formatDuration(remainingMs)}.`}
          </Text>
        </View>

        <View className="gap-3">
          <Button label="Conseguir vidas ilimitadas" icon="👑" onPress={() => router.push('/paywall')} />
          <Button label="Volver al árbol" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <LessonRunner lesson={lesson} />
    </Screen>
  );
}
