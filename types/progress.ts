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

export interface InstrumentProgress {
  instrumentId: string;
  instrumentName: string;
  completedLessons: number;
  totalLessons: number;
}

export interface ProgressSnapshot {
  xp: number;
  gems: number;
  hearts: HeartsState;
  streak: StreakState;
  /** Días con actividad (últimos 30), para el calendario del perfil. Viene del backend. */
  practiceDays: DayKey[];
  /** Total de lecciones completadas, según el backend. */
  totalLessonsCompleted: number;
  /** Progreso por instrumento, según el backend. */
  progressByInstrument: InstrumentProgress[];
  lessons: Record<string, LessonProgress>;
  /** Último instrumento abierto: preferencia local, sin backend. */
  lastInstrumentId: string | null;
  /** TODO(RevenueCat): lo poblará el listener de entitlements. */
  isPremium: boolean;
}
