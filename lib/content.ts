/**
 * Punto único de acceso al currículo real del backend. Reemplaza al antiguo
 * content/index.ts (JSON local): estas funciones son async porque hacen red.
 *
 * instrumentId/unitId no vienen en el JSON de unidades/lecciones del backend
 * (se infieren del endpoint llamado) — se rellenan aquí, una sola vez, para
 * que el resto de la app pueda seguir navegando Instrument → Unit → Lesson
 * como hasta ahora.
 */
import { apiGet, apiPost } from './api';
import { getInstrumentPresentation } from './instrumentPresentation';

import type {
  ApiCompleteLessonResponse,
  ApiInstrument,
  ApiLesson,
  ApiLessonWithExercises,
  ApiProgress,
  ApiUnit,
} from '@/types/api';
import type { Instrument, Lesson, Unit, UnitWithLessons } from '@/types/content';

function toInstrument(raw: ApiInstrument): Instrument {
  return { ...raw, ...getInstrumentPresentation(raw.slug) };
}

function toUnit(raw: ApiUnit, instrumentId: string): Unit {
  return { ...raw, instrumentId };
}

function toLesson(raw: ApiLesson, unitId: string): Lesson {
  return { ...raw, unitId, isPremium: false, requiresMicrophone: false, exercises: [] };
}

export async function fetchInstruments(): Promise<Instrument[]> {
  const raw = await apiGet<ApiInstrument[]>('instruments');
  return raw.map(toInstrument).sort((a, b) => a.order - b.order);
}

export async function fetchUnits(instrumentId: string): Promise<Unit[]> {
  const raw = await apiGet<ApiUnit[]>(`instruments/${instrumentId}/units`);
  return raw.map((unit) => toUnit(unit, instrumentId)).sort((a, b) => a.order - b.order);
}

export async function fetchLessons(unitId: string): Promise<Lesson[]> {
  const raw = await apiGet<ApiLesson[]>(`units/${unitId}/lessons`);
  return raw.map((lesson) => toLesson(lesson, unitId)).sort((a, b) => a.order - b.order);
}

/** Unidades del instrumento con sus lecciones ya resueltas y en orden. */
export async function fetchCurriculum(instrumentId: string): Promise<UnitWithLessons[]> {
  const units = await fetchUnits(instrumentId);
  return Promise.all(units.map(async (unit) => ({ unit, lessons: await fetchLessons(unit.id) })));
}

export function fetchLessonExercises(lessonId: string): Promise<ApiLessonWithExercises> {
  return apiGet<ApiLessonWithExercises>(`lessons/${lessonId}/exercises`);
}

export function fetchProgress(token: string): Promise<ApiProgress> {
  return apiGet<ApiProgress>('progress/me', { token });
}

/**
 * Marca una lección como completada en el backend: otorga el XP real de la
 * lección (una sola vez, es idempotente) y actualiza la racha diaria. Es la
 * única fuente de verdad para XP/racha; el cliente ya no los calcula.
 */
export function completeLessonProgress(
  lessonId: string,
  token: string,
): Promise<ApiCompleteLessonResponse> {
  return apiPost<ApiCompleteLessonResponse>(`progress/me/lessons/${lessonId}/complete`, { token });
}

/**
 * Resta una vida en el backend (nunca baja de 0; llamarlo en 0 es seguro).
 * A diferencia de completeLessonProgress, la respuesta es el progreso
 * directo, sin envolver en `{ progress }`.
 */
export function loseLifeProgress(token: string): Promise<ApiProgress> {
  return apiPost<ApiProgress>('progress/me/lives/lose', { token });
}
