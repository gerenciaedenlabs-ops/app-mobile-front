/** Clave de día local en formato YYYY-MM-DD (ver lib/datetime.ts). */
export type DayKey = string;

export interface LessonProgress {
  completed: boolean;
  /** Mejor puntuación obtenida, 0..1. */
  bestScore: number;
  attempts: number;
  /** ISO string del primer completado. */
  completedAt: string | null;
}

export interface HeartsState {
  current: number;
  max: number;
  /**
   * ISO de cuándo llega la próxima vida, según el backend, o null si ya
   * están al máximo. La regeneración la calcula y aplica el backend; el
   * cliente solo la muestra.
   */
  regenerateAt: string | null;
}

export interface StreakState {
  current: number;
  longest: number;
  /** Último día en que se completó una lección. */
  lastPracticeDay: DayKey | null;
}

export interface ProgressSnapshot {
  xp: number;
  hearts: HeartsState;
  streak: StreakState;
  /** Días con al menos una lección completada, para el calendario del perfil. */
  practiceDays: DayKey[];
  lessons: Record<string, LessonProgress>;
  lastInstrumentId: string | null;
  /** TODO(RevenueCat): lo poblará el listener de entitlements. */
  isPremium: boolean;
}
