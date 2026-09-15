/**
 * Modelo de currículo que consume la app, adaptado del contrato real del
 * backend en lib/content.ts. `instrumentId`/`unitId` no vienen en el JSON del
 * backend (se infieren del endpoint que se llamó) y se rellenan ahí mismo.
 */
import type { Exercise } from './exercise';

/** Slugs reales de la tabla `instrumentos`. Cualquier otro valor cae al genérico. */
export type InstrumentSlug = 'guitar' | 'piano' | 'drums' | 'vocals';

export interface Instrument {
  id: string;
  slug: string;
  name: string;
  /** Emoji de presentación local (el backend no manda ícono). */
  icon: string;
  accentColor: string;
  tagline: string;
  order: number;
}

export interface Unit {
  id: string;
  instrumentId: string;
  title: string;
  description: string | null;
  order: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  order: number;
  xpReward: number;
  /** El backend no modela todavía contenido premium ni ejercicios con micrófono. */
  isPremium: boolean;
  requiresMicrophone: boolean;
  /**
   * Vacío para las lecciones del árbol (`GET /units/:unitId/lessons` no los
   * incluye): se rellena solo al abrir la lección de verdad, con
   * `GET /lessons/:lessonId/exercises` (ver app/lesson/[lessonId].tsx).
   */
  exercises: Exercise[];
}

/**
 * Estado de una lección en el árbol. Es SIEMPRE derivado del progreso:
 * nunca se guarda en el backend ni en el store.
 */
export type LessonState = 'locked' | 'available' | 'completed';

export interface UnitWithLessons {
  unit: Unit;
  lessons: Lesson[];
}
