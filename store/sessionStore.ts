/**
 * Sesión de lección en curso. NO se persiste: si el usuario abandona a medias,
 * la lección se reintenta desde el principio y el progreso guardado no se toca.
 *
 * Separarlo de useProgressStore evita escribir en AsyncStorage en cada tap.
 */
import { create } from 'zustand';

import type { Exercise, ExerciseResult } from '@/types/exercise';

export type SessionStatus = 'idle' | 'running' | 'completed' | 'out_of_hearts';

interface SessionState {
  lessonId: string | null;
  exercises: Exercise[];
  currentIndex: number;
  results: ExerciseResult[];
  heartsLost: number;
  status: SessionStatus;
}

interface SessionActions {
  start: (lessonId: string, exercises: Exercise[]) => void;
  /** Guarda el resultado del ejercicio actual. No avanza. */
  submitResult: (result: ExerciseResult) => void;
  /** Avanza al siguiente ejercicio o cierra la sesión si era el último. */
  advance: () => void;
  outOfHearts: () => void;
  reset: () => void;
}

const INITIAL_STATE: SessionState = {
  lessonId: null,
  exercises: [],
  currentIndex: 0,
  results: [],
  heartsLost: 0,
  status: 'idle',
};

export const useSessionStore = create<SessionState & SessionActions>()((set) => ({
  ...INITIAL_STATE,

  start: (lessonId, exercises) =>
    set({ ...INITIAL_STATE, lessonId, exercises, status: 'running' }),

  submitResult: (result) =>
    set((state) => ({
      results: [...state.results.filter((item) => item.exerciseId !== result.exerciseId), result],
      heartsLost: result.correct ? state.heartsLost : state.heartsLost + 1,
    })),

  advance: () =>
    set((state) => {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.exercises.length) return { status: 'completed' };
      return { currentIndex: nextIndex };
    }),

  outOfHearts: () => set({ status: 'out_of_hearts' }),

  reset: () => set(INITIAL_STATE),
}));

/** Ejercicio actual, o null si la sesión terminó o no ha empezado. */
export function useCurrentExercise(): Exercise | null {
  return useSessionStore((state) => state.exercises[state.currentIndex] ?? null);
}
