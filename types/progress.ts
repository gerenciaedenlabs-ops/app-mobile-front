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
  /**
   * Días con al menos una lección completada, para el calendario del perfil.
   * Se pisa con los últimos 30 días que informa el backend (GET
   * /progress/me/summary); localmente se agrega el día de hoy de forma
   * optimista al completar una lección, antes de confirmar contra el backend.
   */
  practiceDays: DayKey[];
  /** Total de lecciones completadas según el backend (todas las lecciones, no solo las cacheadas localmente). */
  totalLessonsCompleted: number;
  /** Progreso por instrumento según el backend. */
  progressByInstrument: InstrumentProgress[];
  lessons: Record<string, LessonProgress>;
  /** Instrumento que el alumno tenía abierto: preferencia de UI, puramente local (sin endpoint de backend). */
  lastInstrumentId: string | null;
  /** TODO(RevenueCat): lo poblará el listener de entitlements. */
  isPremium: boolean;
}
