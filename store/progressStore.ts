/**
 * Estado persistente del alumno: XP, racha, vidas y progreso por lección.
 *
 * Todo lo que sea "regla" (cómo avanza la racha, cómo se regeneran los
 * corazones) vive en lib/ como función pura. El store solo orquesta y guarda.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayKey } from '@/lib/datetime';
import { consumeHeart, createInitialHearts, refillHearts, regenerateHearts } from '@/lib/hearts';
import { INITIAL_STREAK, registerPractice } from '@/lib/streak';
import type { InstrumentId } from '@/types/content';
import type { LessonProgress, ProgressSnapshot } from '@/types/progress';

export interface CompleteLessonInput {
  lessonId: string;
  xpEarned: number;
  /** 0..1 */
  score: number;
}

interface ProgressActions {
  /** Recalcula lo que depende del reloj. Llamar al montar y al volver a foreground. */
  syncTimeBasedState: () => void;
  loseHeart: () => void;
  /** TODO(RevenueCat): hoy es gratis; debe exigir compra o esperar al contador. */
  refillAllHearts: () => void;
  registerAttempt: (lessonId: string) => void;
  completeLesson: (input: CompleteLessonInput) => void;
  setLastInstrument: (instrumentId: InstrumentId) => void;
  setPremium: (isPremium: boolean) => void;
  resetProgress: () => void;
}

interface ProgressStore extends ProgressSnapshot, ProgressActions {
  hasHydrated: boolean;
}

const EMPTY_LESSON_PROGRESS: LessonProgress = {
  completed: false,
  bestScore: 0,
  attempts: 0,
  completedAt: null,
};

function createInitialSnapshot(): ProgressSnapshot {
  return {
    xp: 0,
    hearts: createInitialHearts(),
    streak: INITIAL_STREAK,
    practiceDays: [],
    lessons: {},
    lastInstrumentId: null,
    isPremium: false,
  };
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...createInitialSnapshot(),
      hasHydrated: false,

      syncTimeBasedState: () => {
        const synced = regenerateHearts(get().hearts);
        if (synced !== get().hearts) set({ hearts: synced });
      },

      loseHeart: () => set((state) => ({ hearts: consumeHeart(state.hearts) })),

      refillAllHearts: () => set((state) => ({ hearts: refillHearts(state.hearts) })),

      registerAttempt: (lessonId) =>
        set((state) => {
          const previous = state.lessons[lessonId] ?? EMPTY_LESSON_PROGRESS;
          return {
            lessons: {
              ...state.lessons,
              [lessonId]: { ...previous, attempts: previous.attempts + 1 },
            },
          };
        }),

      completeLesson: ({ lessonId, xpEarned, score }) =>
        set((state) => {
          const day = todayKey();
          const previous = state.lessons[lessonId] ?? EMPTY_LESSON_PROGRESS;

          return {
            xp: state.xp + xpEarned,
            streak: registerPractice(state.streak, day),
            practiceDays: state.practiceDays.includes(day)
              ? state.practiceDays
              : [...state.practiceDays, day],
            lessons: {
              ...state.lessons,
              [lessonId]: {
                completed: true,
                bestScore: Math.max(previous.bestScore, score),
                attempts: previous.attempts,
                completedAt: previous.completedAt ?? new Date().toISOString(),
              },
            },
          };
        }),

      setLastInstrument: (instrumentId) => set({ lastInstrumentId: instrumentId }),

      setPremium: (isPremium) => set({ isPremium }),

      resetProgress: () => set(createInitialSnapshot()),
    }),
    {
      name: 'edenship-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Las acciones y el flag de hidratación no se guardan.
      partialize: ({ xp, hearts, streak, practiceDays, lessons, lastInstrumentId, isPremium }) => ({
        xp,
        hearts,
        streak,
        practiceDays,
        lessons,
        lastInstrumentId,
        isPremium,
      }),
      onRehydrateStorage: () => (state) => {
        // Los corazones se ponen al día con el tiempo transcurrido con la app cerrada.
        state?.syncTimeBasedState();
        useProgressStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** Progreso de una lección concreta, con valores por defecto. */
export function getLessonProgress(lessonId: string): LessonProgress {
  return useProgressStore.getState().lessons[lessonId] ?? EMPTY_LESSON_PROGRESS;
}

/**
 * Set de lecciones completadas.
 *
 * Se deriva con useMemo y no dentro del selector: zustand v5 usa
 * `useSyncExternalStore` y devolver un Set nuevo en cada llamada rompe la
 * comparación de snapshots.
 */
export function useCompletedLessonIds(): ReadonlySet<string> {
  const lessons = useProgressStore((state) => state.lessons);
  return useMemo(
    () =>
      new Set(
        Object.entries(lessons)
          .filter(([, progress]) => progress.completed)
          .map(([lessonId]) => lessonId),
      ),
    [lessons],
  );
}
