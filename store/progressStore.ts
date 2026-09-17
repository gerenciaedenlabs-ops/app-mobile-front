/**
 * Estado persistente del alumno: XP, racha, vidas y progreso por lección.
 *
 * XP, racha, vidas, gemas, calendario de actividad (últimos 30 días) y
 * progreso por instrumento los calcula el backend (ver applyRemoteSummary,
 * GET /progress/me/summary); el store solo los refleja y los cachea
 * localmente para que la app tenga algo que mostrar al abrir sin red. Lo que
 * sigue siendo puramente local es el progreso por lección
 * (completed/bestScore/attempts) y el instrumento seleccionado
 * (lastInstrumentId): preferencia de UI, sin endpoint de backend.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type PersistStorage } from 'zustand/middleware';

import { completeLessonProgress, fetchProgressSummary, loseLifeProgress } from '@/lib/content';
import { todayKey } from '@/lib/datetime';
import { createInitialHearts } from '@/lib/hearts';
import { INITIAL_STREAK } from '@/lib/streak';
import type { ApiProgress, ApiProgressSummary } from '@/types/api';
import type { LessonProgress, ProgressSnapshot } from '@/types/progress';

/** Aplica al store el progreso tal como lo devuelve el backend: xp/racha/vidas son suyos. */
function applyRemoteProgress(remote: ApiProgress): void {
  useProgressStore.setState((state) => ({
    xp: remote.xpTotal,
    hearts: { ...state.hearts, current: remote.lives, max: remote.maxLives, regenerateAt: remote.livesRegenerateAt },
    streak: {
      current: remote.currentStreak,
      longest: remote.longestStreak,
      lastPracticeDay: remote.lastPracticeDate,
    },
  }));
}

/**
 * Aplica al store el resumen agregado de GET /progress/me/summary: xp/racha/
 * vidas (igual que applyRemoteProgress) más gemas, calendario de actividad
 * (últimos 30 días) y progreso por instrumento, todo en un solo request.
 */
function applyRemoteSummary(remote: ApiProgressSummary): void {
  useProgressStore.setState((state) => ({
    xp: remote.xpTotal,
    gems: remote.gems,
    hearts: { ...state.hearts, current: remote.lives, max: remote.maxLives, regenerateAt: remote.livesRegenerateAt },
    streak: {
      current: remote.currentStreak,
      longest: remote.longestStreak,
      lastPracticeDay: remote.lastPracticeDate,
    },
    practiceDays: remote.activeDates,
    totalLessonsCompleted: remote.totalLessonsCompleted,
    progressByInstrument: remote.progressByInstrument,
  }));
}

export interface CompleteLessonInput {
  lessonId: string;
  /** 0..1 */
  score: number;
  token: string | null;
}

export interface CompleteLessonResult {
  /** true si esta llamada otorgó XP nuevo (false si la lección ya estaba completada, o si falló la red). */
  xpAwarded: boolean;
}

interface ProgressActions {
  /** Trae xp/racha/vidas frescos del backend. Llamar al montar y al volver a foreground. */
  refreshProgress: (token: string | null) => Promise<void>;
  loseHeart: (token: string | null) => Promise<void>;
  /** TODO(RevenueCat): hoy es gratis; debe exigir compra o esperar al contador. Solo local: no hay endpoint de recarga. */
  refillAllHearts: () => void;
  registerAttempt: (lessonId: string) => void;
  completeLesson: (input: CompleteLessonInput) => Promise<CompleteLessonResult>;
  setLastInstrument: (instrumentId: string) => void;
  setPremium: (isPremium: boolean) => void;
  resetProgress: () => void;
}

interface ProgressStore extends ProgressSnapshot, ProgressActions {
  hasHydrated: boolean;
}

const progressStorage = createJSONStorage<ProgressSnapshot>(() => AsyncStorage);
const silentStorage: PersistStorage<ProgressSnapshot> = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};
let activeProgressUserId: string | null = null;

const EMPTY_LESSON_PROGRESS: LessonProgress = {
  completed: false,
  bestScore: 0,
  attempts: 0,
  completedAt: null,
};

function createInitialSnapshot(): ProgressSnapshot {
  return {
    xp: 0,
    gems: 0,
    hearts: createInitialHearts(),
    streak: INITIAL_STREAK,
    practiceDays: [],
    totalLessonsCompleted: 0,
    progressByInstrument: [],
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

      refreshProgress: async (token) => {
        if (!token) return;
        try {
          applyRemoteSummary(await fetchProgressSummary(token));
        } catch {
          // Sin red o el backend no respondió: se mantiene el estado que había.
        }
      },

      loseHeart: async (token) => {
        // Feedback inmediato mientras se confirma contra el backend.
        set((state) => ({ hearts: { ...state.hearts, current: Math.max(0, state.hearts.current - 1) } }));
        if (!token) return;
        try {
          applyRemoteProgress(await loseLifeProgress(token));
        } catch {
          // Sin red: se queda con el descuento optimista; se corrige en el próximo refreshProgress.
        }
      },

      refillAllHearts: () =>
        set((state) => ({ hearts: { ...state.hearts, current: state.hearts.max, regenerateAt: null } })),

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

      completeLesson: async ({ lessonId, score, token }) => {
        const day = todayKey();
        const previous = get().lessons[lessonId] ?? EMPTY_LESSON_PROGRESS;

        const markLessonDone = () =>
          set((state) => ({
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
          }));

        if (!token) {
          // Sin sesión no hay a quién otorgarle XP/racha en el backend.
          markLessonDone();
          return { xpAwarded: false };
        }

        try {
          const { progress, xpAwarded } = await completeLessonProgress(lessonId, token);
          markLessonDone();
          applyRemoteProgress(progress);
          return { xpAwarded };
        } catch {
          // Sin red o el backend no respondió: la lección se marca localmente
          // (para no bloquear el árbol de lecciones) pero XP/racha no avanzan
          // hasta que se pueda confirmar contra el backend.
          markLessonDone();
          return { xpAwarded: false };
        }
      },

      setLastInstrument: (instrumentId) => set({ lastInstrumentId: instrumentId }),

      setPremium: (isPremium) => set({ isPremium }),

      resetProgress: () => set(createInitialSnapshot()),
    }),
    {
      name: 'edenship-progress',
      version: 1,
      storage: progressStorage,
      skipHydration: true,
      // Las acciones y el flag de hidratación no se guardan.
      partialize: ({
        xp,
        gems,
        hearts,
        streak,
        practiceDays,
        totalLessonsCompleted,
        progressByInstrument,
        lessons,
        lastInstrumentId,
        isPremium,
      }) => ({
        xp,
        gems,
        hearts,
        streak,
        practiceDays,
        totalLessonsCompleted,
        progressByInstrument,
        lessons,
        lastInstrumentId,
        isPremium,
      }),
      onRehydrateStorage: () => () => {
        useProgressStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/**
 * Cambia el namespace persistente antes de cargar el progreso. Durante el
 * cambio se usa un storage nulo para no sobrescribir los datos del otro alumno.
 *
 * El backend es la única fuente de verdad para xp/racha/vidas/gemas/
 * calendario de actividad/progreso por instrumento: en cada hidratación se
 * pisan con GET /progress/me/summary, sin importar si ya había un snapshot
 * local (uno viejo puede traer arrastrado XP/racha calculados localmente de
 * antes de que existiera el endpoint de escritura). Lo único que se
 * conserva del snapshot local es lo que el backend no modela: lecciones
 * completadas (para no bloquear el árbol offline), último instrumento y
 * premium. De ahí en adelante, xp/racha/vidas se mantienen al día llamando a
 * completeLesson en cada lección terminada (POST /progress/me/lessons/:id/complete).
 */
export async function hydrateProgressForUser(userId: string, token: string | null): Promise<void> {
  if (activeProgressUserId === userId && useProgressStore.getState().hasHydrated) return;

  const storageKey = `edenship-progress:${userId}`;

  useProgressStore.persist.setOptions({ storage: silentStorage });
  useProgressStore.setState({ ...createInitialSnapshot(), hasHydrated: false });
  useProgressStore.persist.setOptions({ name: storageKey, storage: progressStorage });
  activeProgressUserId = userId;
  await useProgressStore.persist.rehydrate();

  if (token) {
    try {
      applyRemoteSummary(await fetchProgressSummary(token));
    } catch {
      // Sin red o el backend no respondió: se sigue con los defaults/snapshot local.
    }
  }

  if (!useProgressStore.getState().hasHydrated) {
    useProgressStore.setState({ hasHydrated: true });
  }
}

export function unloadProgressUser(): void {
  activeProgressUserId = null;
  useProgressStore.persist.setOptions({ storage: silentStorage });
  useProgressStore.setState({ ...createInitialSnapshot(), hasHydrated: false });
}

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
