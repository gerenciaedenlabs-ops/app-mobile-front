/**
 * Racha diaria. Funciones puras: reciben el estado y el día, devuelven estado
 * nuevo. Nunca leen el reloj por su cuenta para que sean testeables.
 */
import type { DayKey, StreakState } from '@/types/progress';

import { daysBetween } from './datetime';

export const INITIAL_STREAK: StreakState = {
  current: 0,
  longest: 0,
  lastPracticeDay: null,
};

/**
 * Racha que ve el usuario HOY. Si no practica hoy la racha sigue viva (aún
 * puede salvarla), pero si el último día practicado es anterior a ayer ya está
 * rota, y hay que mostrar 0 aunque el estado persistido diga otra cosa.
 *
 * Se resuelve al leer y no al escribir: así no hace falta un job que "expire"
 * la racha con la app cerrada.
 */
export function getEffectiveStreak(streak: StreakState, today: DayKey): number {
  if (streak.lastPracticeDay === null) return 0;
  const gap = daysBetween(streak.lastPracticeDay, today);
  if (gap === null) return 0;
  return gap <= 1 ? streak.current : 0;
}

/** true si aún no se ha practicado hoy y la racha se pierde al acabar el día. */
export function isStreakAtRisk(streak: StreakState, today: DayKey): boolean {
  if (streak.lastPracticeDay === null) return false;
  return daysBetween(streak.lastPracticeDay, today) === 1 && streak.current > 0;
}

export function hasPracticedToday(streak: StreakState, today: DayKey): boolean {
  return streak.lastPracticeDay === today;
}
