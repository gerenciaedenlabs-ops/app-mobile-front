/**
 * Punto único de acceso al currículo real del backend. Reemplaza al antiguo
 * content/index.ts (JSON local): estas funciones son async porque hacen red.
 *
 * instrumentId/unitId no vienen en el JSON de unidades/lecciones del backend
 * (se infieren del endpoint llamado) — se rellenan aquí, una sola vez, para
 * que el resto de la app pueda seguir navegando Instrument → Unit → Lesson
 * como hasta ahora.
 */
import { ApiError, apiGet, apiPost } from './api';
import { getInstrumentPresentation } from './instrumentPresentation';

import type {
  ApiAchievement,
  ApiClub,
  ApiClubDetail,
  ApiCompleteLessonResponse,
  ApiInstrument,
  ApiInventoryItem,
  ApiLeagueMe,
  ApiLesson,
  ApiLessonWithExercises,
  ApiMission,
  ApiNewsItem,
  ApiProgress,
  ApiProgressSummary,
  ApiShopItem,
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

/** Resumen agregado para la pantalla de progreso, en un solo request. */
export function fetchProgressSummary(token: string): Promise<ApiProgressSummary> {
  return apiGet<ApiProgressSummary>('progress/me/summary', { token });
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

/** Misiones diarias + reto mensual del usuario. Requiere sesión. */
export function fetchMissions(token: string): Promise<ApiMission[]> {
  return apiGet<ApiMission[]>('missions/me', { token });
}

/**
 * Liga y ranking semanal del usuario. null si no hay temporada activa (404):
 * es un estado esperado, no un error de red — "todavía no hay liga", igual
 * que un instrumento sin unidades sembradas.
 */
export async function fetchLeague(token: string): Promise<ApiLeagueMe | null> {
  try {
    return await apiGet<ApiLeagueMe>('leagues/me', { token });
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) return null;
    throw cause;
  }
}

export function fetchClubs(): Promise<ApiClub[]> {
  return apiGet<ApiClub[]>('clubs');
}

export function fetchClub(clubId: string): Promise<ApiClubDetail> {
  return apiGet<ApiClubDetail>(`clubs/${clubId}`);
}

export function fetchAchievements(token: string): Promise<ApiAchievement[]> {
  return apiGet<ApiAchievement[]>('achievements/me', { token });
}

export function fetchShopItems(): Promise<ApiShopItem[]> {
  return apiGet<ApiShopItem[]>('shop/items');
}

export function fetchShopInventory(token: string): Promise<ApiInventoryItem[]> {
  return apiGet<ApiInventoryItem[]>('shop/me/inventory', { token });
}

export function fetchNews(): Promise<ApiNewsItem[]> {
  return apiGet<ApiNewsItem[]>('news');
}
