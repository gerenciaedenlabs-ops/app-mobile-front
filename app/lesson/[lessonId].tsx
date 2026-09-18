import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { mapApiExercise } from '@/features/lesson/mapExercise';
import { LessonRunner } from '@/features/lesson/LessonRunner';
import { useNextHeartCountdown } from '@/hooks/useHearts';
import { useLessonExercises } from '@/hooks/useContent';
import { formatDuration } from '@/lib/datetime';
import { useProgressStore } from '@/store/progressStore';
import type { Lesson } from '@/types/content';
import { useThemeColors } from '@/store/themeStore';

/** Cuando se entra por deep link sin pasar por el árbol y no se conoce el xpReward real. */
const FALLBACK_XP_REWARD = 10;

export default function LessonScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { lessonId, instrumentId, xpReward } = useLocalSearchParams<{
    lessonId: string;
    instrumentId?: string;
    xpReward?: string;
  }>();

  const hearts = useProgressStore((state) => state.hearts);
  const isPremium = useProgressStore((state) => state.isPremium);
  const remainingMs = useNextHeartCountdown();

  /**
   * Se comprueba SOLO al entrar. Si fuese reactivo, perder la última vida a
   * mitad de lección desmontaría el runner en pleno feedback y la sesión nunca
   * llegaría a la pantalla de resultado.
   */
  const [enteredWithoutHearts] = useState(() => useProgressStore.getState().hearts.current <= 0);
  const blockedByHearts = enteredWithoutHearts && hearts.current <= 0;

  const exercisesState = useLessonExercises(lessonId);
  const lesson = useMemo<Lesson | null>(() => {
    if (!exercisesState.data) return null;
    return {
      id: exercisesState.data.lessonId,
      // El backend no manda unitId aquí; nada en este flujo lo necesita ya
      // que instrumentId viaja aparte por el querystring.
      unitId: '',
      title: exercisesState.data.lessonTitle,
      order: 0,
      // Tampoco manda xpReward: viene del listado de lecciones y se propaga
      // por querystring desde app/learn/[instrumentId].tsx.
      xpReward: xpReward ? Number(xpReward) : FALLBACK_XP_REWARD,
      isPremium: false,
      requiresMicrophone: false,
      exercises: exercisesState.data.exercises.map(mapApiExercise),
    };
  }, [exercisesState.data, xpReward]);

  if (exercisesState.status === 'loading') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (exercisesState.status === 'error') {
    const notFound = exercisesState.error?.code === 'NOT_FOUND' || exercisesState.error?.status === 404;
    return (
      <Screen>
        <EmptyState
          icon={notFound ? '🔍' : '📡'}
          title={notFound ? 'Lección no encontrada' : 'No se pudo cargar la lección'}
          description={
            notFound
              ? `No hay ninguna lección con id "${lessonId ?? ''}".`
              : (exercisesState.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.')
          }
          className="flex-1"
        />
        <Button label="Volver" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!lesson) return null;

  // El contenido de pago no se abre ni por deep link (hoy el backend nunca marca lecciones premium).
  if (lesson.isPremium && !isPremium) return <Redirect href="/paywall" />;

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
      <LessonRunner lesson={lesson} instrumentId={instrumentId} />
    </Screen>
  );
}
