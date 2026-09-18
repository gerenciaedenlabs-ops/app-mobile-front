/**
 * Hooks de datos para el currículo real del backend. Sin librería de fetching
 * (React Query, SWR): el mismo patrón manual que ya usa authStore, solo que
 * como hook en vez de store, porque no hace falta compartir el estado.
 */
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/lib/api';
import {
  fetchAchievements,
  fetchClub,
  fetchClubs,
  fetchCurriculum,
  fetchInstruments,
  fetchLeague,
  fetchLessonExercises,
  fetchMissions,
  fetchNews,
  fetchShopInventory,
  fetchShopItems,
} from '@/lib/content';
import { useAuthStore } from '@/store/authStore';
import type {
  ApiAchievement,
  ApiClub,
  ApiClubDetail,
  ApiInventoryItem,
  ApiLeagueMe,
  ApiLessonWithExercises,
  ApiMission,
  ApiNewsItem,
  ApiShopItem,
} from '@/types/api';
import type { Instrument, UnitWithLessons } from '@/types/content';

export interface FetchState<T> {
  status: 'loading' | 'error' | 'success';
  data: T | null;
  error: ApiError | null;
  refetch: () => void;
}

function toApiError(cause: unknown): ApiError {
  return cause instanceof ApiError ? cause : new ApiError('No se pudo cargar la información.', 0);
}

function useFetchState<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): FetchState<T> {
  const [status, setStatus] = useState<FetchState<T>['status']>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setError(null);

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(toApiError(cause));
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // Las dependencias reales son las de la lista `deps` del llamador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((value) => value + 1), []);

  return { status, data, error, refetch };
}

export function useInstruments(): FetchState<Instrument[]> {
  return useFetchState(fetchInstruments, []);
}

/**
 * Currículo resuelto de varios instrumentos a la vez, indexado por
 * instrumentId. Pensado para la pantalla de selección de instrumento, que
 * necesita el total de lecciones de cada uno para pintar su barra de
 * progreso (o "próximamente" si de verdad no tiene unidades).
 */
export function useCurriculaByInstrument(
  instrumentIds: readonly string[],
): FetchState<Record<string, UnitWithLessons[]>> {
  const key = instrumentIds.join(',');
  return useFetchState(async () => {
    const entries = await Promise.all(
      instrumentIds.map(async (id) => [id, await fetchCurriculum(id)] as const),
    );
    return Object.fromEntries(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** null/undefined mientras no se conoce el instrumento todavía (p. ej. params sin hidratar). */
export function useCurriculum(instrumentId: string | undefined): FetchState<UnitWithLessons[]> {
  return useFetchState(
    () => (instrumentId ? fetchCurriculum(instrumentId) : Promise.resolve([])),
    [instrumentId],
  );
}

export function useLessonExercises(lessonId: string | undefined): FetchState<ApiLessonWithExercises> {
  return useFetchState(() => {
    if (!lessonId) return Promise.reject(new ApiError('Falta el id de la lección.', 0));
    return fetchLessonExercises(lessonId);
  }, [lessonId]);
}

/** Misiones diarias + reto mensual. Sin sesión no hay a quién pedírselas: lista vacía. */
export function useMissions(): FetchState<ApiMission[]> {
  const token = useAuthStore((state) => state.token);
  return useFetchState(() => (token ? fetchMissions(token) : Promise.resolve([])), [token]);
}

/** Liga y ranking semanal. null es un estado válido: "no hay temporada activa". */
export function useLeague(): FetchState<ApiLeagueMe | null> {
  const token = useAuthStore((state) => state.token);
  return useFetchState(() => (token ? fetchLeague(token) : Promise.resolve(null)), [token]);
}

export function useClubs(): FetchState<ApiClub[]> {
  return useFetchState(fetchClubs, []);
}

export function useClub(clubId: string | undefined): FetchState<ApiClubDetail> {
  return useFetchState(() => {
    if (!clubId) return Promise.reject(new ApiError('Falta el id del clan.', 0));
    return fetchClub(clubId);
  }, [clubId]);
}

export function useAchievements(): FetchState<ApiAchievement[]> {
  const token = useAuthStore((state) => state.token);
  return useFetchState(() => (token ? fetchAchievements(token) : Promise.resolve([])), [token]);
}

export function useShopItems(): FetchState<ApiShopItem[]> {
  return useFetchState(fetchShopItems, []);
}

export function useShopInventory(): FetchState<ApiInventoryItem[]> {
  const token = useAuthStore((state) => state.token);
  return useFetchState(() => (token ? fetchShopInventory(token) : Promise.resolve([])), [token]);
}

export function useNews(): FetchState<ApiNewsItem[]> {
  return useFetchState(fetchNews, []);
}
