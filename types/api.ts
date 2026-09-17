/**
 * Espejo exacto del contrato del backend real (Fastify), tal como lo devuelve
 * la API. Estos tipos son el formato "de la red"; `types/content.ts` y
 * `types/exercise.ts` son el formato que consume el resto de la app y se
 * obtienen adaptando estos en `lib/content.ts` / `features/lesson/mapExercise.ts`.
 */

export interface ApiInstrument {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  order: number;
}

export interface ApiUnit {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

export interface ApiLesson {
  id: string;
  title: string;
  order: number;
  xpReward: number;
}

/** Los 7 tipos que existen en `tipos_ejercicio`. Solo los dos primeros tienen `data` documentada hoy. */
export type ApiExerciseType =
  | 'opcion_multiple'
  | 'escuchar_y_elegir'
  | 'ritmo_toque'
  | 'deteccion_guitarra'
  | 'emparejar'
  | 'banco_palabras'
  | 'dictado';

export type ApiExerciseDifficulty = 'principiante' | 'intermedio' | 'avanzado';

export interface ApiMultipleChoiceData {
  opciones: string[];
  respuestaCorrectaIndice: number;
  dificultad: ApiExerciseDifficulty;
}

export interface ApiListenAndChooseData extends ApiMultipleChoiceData {
  urlAudio: string;
}

export interface ApiExercise {
  id: string;
  type: ApiExerciseType;
  typeName: string;
  prompt: string;
  /** Forma libre; solo está documentada para opcion_multiple/escuchar_y_elegir. */
  data: ApiMultipleChoiceData | ApiListenAndChooseData | Record<string, unknown>;
  order: number;
}

export interface ApiLessonWithExercises {
  lessonId: string;
  lessonTitle: string;
  exercises: ApiExercise[];
}

export interface ApiProgress {
  /** UUID desde la migración de usuarios.id; solo informativo, el cliente no lo usa. */
  userId: string;
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  maxLives: number;
  gems: number;
  lastPracticeDate: string | null;
  /** ISO de cuándo llega la próxima vida, o null si ya están al máximo. */
  livesRegenerateAt: string | null;
  updatedAt: string;
}

/** Respuesta de POST /progress/me/lessons/:lessonId/complete. */
export interface ApiCompleteLessonResponse {
  progress: ApiProgress;
  /** false si la lección ya se había completado antes (no se repite el XP, es idempotente). */
  xpAwarded: boolean;
}

export interface ApiInstrumentProgress {
  instrumentId: string;
  instrumentName: string;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Respuesta de GET /progress/me/summary: agrega en un solo request lo que la
 * pantalla de progreso necesita (xp/racha/vidas, calendario de actividad de
 * los últimos 30 días y progreso por instrumento) para evitar 3-4 llamadas.
 */
export interface ApiProgressSummary {
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  maxLives: number;
  livesRegenerateAt: string | null;
  gems: number;
  lastPracticeDate: string | null;
  updatedAt: string;
  totalLessonsCompleted: number;
  /** "YYYY-MM-DD"[], últimos 30 días con al menos 1 lección completada. */
  activeDates: string[];
  progressByInstrument: ApiInstrumentProgress[];
}
