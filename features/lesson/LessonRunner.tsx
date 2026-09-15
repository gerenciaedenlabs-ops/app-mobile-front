import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';

import { computeLessonScore } from '@/lib/scoring';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useCurrentExercise, useSessionStore } from '@/store/sessionStore';
import type { Lesson } from '@/types/content';
import type { ExerciseResult } from '@/types/exercise';

import { ExerciseRenderer } from './ExerciseRenderer';
import { FeedbackFooter } from './FeedbackFooter';
import { LessonTopBar } from './LessonTopBar';

interface LessonRunnerProps {
  lesson: Lesson;
  /** Para volver al árbol correcto desde la pantalla de resultado. */
  instrumentId?: string;
}

/**
 * Máquina de la sesión: encadena ejercicios, descuenta vidas y, al terminar,
 * consolida XP y racha antes de navegar al resultado.
 */
export function LessonRunner({ lesson, instrumentId }: LessonRunnerProps) {
  const router = useRouter();

  const start = useSessionStore((state) => state.start);
  const submitResult = useSessionStore((state) => state.submitResult);
  const advance = useSessionStore((state) => state.advance);
  const outOfHearts = useSessionStore((state) => state.outOfHearts);
  const reset = useSessionStore((state) => state.reset);

  const status = useSessionStore((state) => state.status);
  const currentIndex = useSessionStore((state) => state.currentIndex);
  const results = useSessionStore((state) => state.results);
  const exercise = useCurrentExercise();

  const hearts = useProgressStore((state) => state.hearts);
  const loseHeart = useProgressStore((state) => state.loseHeart);
  const completeLesson = useProgressStore((state) => state.completeLesson);
  const registerAttempt = useProgressStore((state) => state.registerAttempt);
  const token = useAuthStore((state) => state.token);

  /** Evita consolidar el progreso dos veces si el efecto se vuelve a ejecutar. */
  const settledRef = useRef(false);

  useEffect(() => {
    settledRef.current = false;
    start(lesson.id, lesson.exercises);
    registerAttempt(lesson.id);
    // Al desmontar se limpia la sesión: abandonar no deja restos.
    return () => reset();
  }, [lesson.id, lesson.exercises, start, registerAttempt, reset]);

  const currentResult = exercise
    ? (results.find((item) => item.exerciseId === exercise.id) ?? null)
    : null;

  const handleResult = useCallback(
    (result: ExerciseResult) => {
      submitResult(result);
      if (!result.correct) void loseHeart(token);
    },
    [submitResult, loseHeart, token],
  );

  const handleContinue = useCallback(() => {
    // Las vidas se comprueban al continuar para que el usuario vea antes el feedback.
    if (useProgressStore.getState().hearts.current <= 0) {
      outOfHearts();
      return;
    }
    advance();
  }, [advance, outOfHearts]);

  const handleExit = useCallback(() => {
    Alert.alert('¿Salir de la lección?', 'Perderás el progreso de esta sesión.', [
      { text: 'Seguir practicando', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  }, [reset, router]);

  // Fin de sesión: consolidar contra el backend y navegar al resultado.
  useEffect(() => {
    if (settledRef.current) return;
    if (status !== 'completed' && status !== 'out_of_hearts') return;
    settledRef.current = true;

    const passed = status === 'completed';
    const score = computeLessonScore(results);

    const goToResult = (xpEarned: number) =>
      router.replace({
        pathname: '/lesson/result',
        params: {
          lessonTitle: lesson.title,
          instrumentId: instrumentId ?? '',
          outcome: passed ? 'passed' : 'failed',
          xp: String(xpEarned),
          correct: String(results.filter((result) => result.correct).length),
          total: String(lesson.exercises.length),
        },
      });

    if (!passed) {
      goToResult(0);
      return;
    }

    // El XP real lo otorga y calcula el backend; el cliente solo lo refleja.
    void completeLesson({ lessonId: lesson.id, score, token }).then(({ xpAwarded }) =>
      goToResult(xpAwarded ? lesson.xpReward : 0),
    );
  }, [status, results, lesson, completeLesson, router, instrumentId, token]);

  if (!exercise) return null;

  const isLastExercise = currentIndex === lesson.exercises.length - 1;
  const explanation =
    currentResult && 'explanation' in exercise ? exercise.explanation : undefined;

  return (
    <View className="flex-1">
      <LessonTopBar
        progress={currentIndex / lesson.exercises.length}
        hearts={hearts.current}
        maxHearts={hearts.max}
        onExit={handleExit}
      />

      <View className="flex-1">
        {/* La key reinicia el estado interno del componente al cambiar de ejercicio. */}
        <ExerciseRenderer
          key={exercise.id}
          exercise={exercise}
          result={currentResult}
          onResult={handleResult}
        />
      </View>

      {currentResult ? (
        <FeedbackFooter
          correct={currentResult.correct}
          explanation={explanation}
          actionLabel={isLastExercise ? 'Terminar' : 'Continuar'}
          onContinue={handleContinue}
        />
      ) : null}
    </View>
  );
}
