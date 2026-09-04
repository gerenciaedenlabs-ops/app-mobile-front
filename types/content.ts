import type { Exercise, ExerciseType } from './exercise';

export const INSTRUMENT_IDS = ['guitar', 'piano', 'drums', 'voice'] as const;

export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export interface Instrument {
  id: InstrumentId;
  name: string;
  /** Emoji por ahora; sustituible por un set de íconos sin tocar el resto del código. */
  icon: string;
  /** Color de acento del árbol y de los nodos, en hex. */
  accentColor: string;
  tagline: string;
}

export interface Unit {
  id: string;
  instrumentId: InstrumentId;
  title: string;
  /** 1-based y contiguo dentro de cada instrumento. */
  order: number;
  /** Orden explícito de lecciones; es la fuente de verdad del desbloqueo. */
  lessonIds: string[];
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  /** 1-based dentro de la unidad. Debe coincidir con la posición en Unit.lessonIds. */
  order: number;
  xpReward: number;
  /** Resumen para pintar el nodo del árbol sin cargar los ejercicios. */
  exerciseTypes: ExerciseType[];
  /** true → requiere permiso de micrófono y dev build (no funciona en Expo Go). */
  requiresMicrophone: boolean;
  /** true → detrás del paywall. */
  isPremium: boolean;
  exercises: Exercise[];
}

/**
 * Estado de una lección en el árbol. Es SIEMPRE derivado del progreso:
 * nunca se guarda en el JSON de contenido ni en el store.
 */
export type LessonState = 'locked' | 'available' | 'completed';

export interface UnitWithLessons {
  unit: Unit;
  lessons: Lesson[];
}
