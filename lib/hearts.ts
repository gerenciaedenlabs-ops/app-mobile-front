/**
 * Vidas / corazones.
 *
 * La regeneración la calcula y aplica el backend (POST .../lives/lose y
 * GET /progress/me ya devuelven el estado al día); aquí solo queda el
 * default inicial y el cálculo de la cuenta atrás para mostrarla en pantalla.
 */
import type { HeartsState } from '@/types/progress';

export const MAX_HEARTS = 5;

export function createInitialHearts(): HeartsState {
  return { current: MAX_HEARTS, max: MAX_HEARTS, regenerateAt: null };
}

/** ms hasta la próxima vida, o null si ya están al máximo (o no hay dato del backend todavía). */
export function msUntilNextHeart(hearts: HeartsState, now: number = Date.now()): number | null {
  if (hearts.current >= hearts.max || !hearts.regenerateAt) return null;
  return Math.max(0, new Date(hearts.regenerateAt).getTime() - now);
}
