import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';

import { computeLessonScore, computeXpEarned } from '@/lib/scoring';
import { useProgressStore } from '@/store/progressStore';
import { useCurrentExercise, useSessionStore } from '@/store/sessionStore';
import type { Lesson } from '@/types/content';
import type { ExerciseResult } from '@/types/exercise';

import { ExerciseRenderer } from './ExerciseRenderer';
import { FeedbackFooter } from './FeedbackFooter';
import { LessonTopBar } from './LessonTopBar';

interface LessonRunnerProps {
  lesson: Lesson;
}

/**
 * Máquina de la sesión: encadena ejercicios, descuenta vidas y, al terminar,
 * consolida XP y racha antes de navegar al resultado.
 */
export function LessonRunner({ lesson }: LessonRunnerProps) {
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
      if (!result.correct) loseHeart();
    },
    [submitResult, loseHeart],
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

  // Fin de sesión: consolidar y navegar al resultado.
  useEffect(() => {
    if (settledRef.current) return;
    if (status !== 'completed' && status !== 'out_of_hearts') return;
    settledRef.current = true;

    const passed = status === 'completed';
    const score = computeLessonScore(results);
    const xpEarned = passed ? computeXpEarned(lesson, results) : 0;

    if (passed) completeLesson({ lessonId: lesson.id, xpEarned, score });

    router.replace({
      pathname: '/lesson/result',
      params: {
        lessonId: lesson.id,
        outcome: passed ? 'passed' : 'failed',
        xp: String(xpEarned),
        correct: String(results.filter((result) => result.correct).length),
        total: String(lesson.exercises.length),
      },
    });
  }, [status, results, lesson, completeLesson, router]);

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
