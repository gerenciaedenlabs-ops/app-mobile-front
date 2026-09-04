/**
 * Vidas / corazones.
 *
 * La regeneración es perezosa: no hay timers persistentes ni trabajo en
 * background. Se recalcula a partir de `lastRegenAt` cada vez que la app se
 * abre o vuelve a primer plano, así que también funciona con la app cerrada.
 */
import type { HeartsState } from '@/types/progress';

export const MAX_HEARTS = 5;
/** Un corazón cada 30 minutos. */
export const HEART_REGEN_MS = 30 * 60 * 1000;

export function createInitialHearts(now: number = Date.now()): HeartsState {
  return { current: MAX_HEARTS, max: MAX_HEARTS, lastRegenAt: now };
}

/** Aplica los corazones acumulados desde `lastRegenAt`. */
export function regenerateHearts(hearts: HeartsState, now: number = Date.now()): HeartsState {
  if (hearts.current >= hearts.max) {
    // Estando lleno el contador no corre: se reinicia con el primer fallo.
    return hearts.lastRegenAt === now ? hearts : { ...hearts, lastRegenAt: now };
  }

  const elapsed = now - hearts.lastRegenAt;
  if (elapsed < HEART_REGEN_MS) return hearts;

  const earned = Math.floor(elapsed / HEART_REGEN_MS);
  const current = Math.min(hearts.max, hearts.current + earned);

  return {
    ...hearts,
    current,
    // Se conserva el resto del intervalo en curso para no regalar tiempo.
    lastRegenAt: current >= hearts.max ? now : hearts.lastRegenAt + earned * HEART_REGEN_MS,
  };
}

/** Descuenta un corazón y arranca el contador si estaba lleno. */
export function consumeHeart(hearts: HeartsState, now: number = Date.now()): HeartsState {
  const synced = regenerateHearts(hearts, now);
  if (synced.current <= 0) return synced;

  return {
    ...synced,
    current: synced.current - 1,
    lastRegenAt: synced.current === synced.max ? now : synced.lastRegenAt,
  };
}

export function refillHearts(hearts: HeartsState, now: number = Date.now()): HeartsState {
  return { ...hearts, current: hearts.max, lastRegenAt: now };
}

/** ms hasta el próximo corazón, o null si ya está lleno. */
export function msUntilNextHeart(hearts: HeartsState, now: number = Date.now()): number | null {
  if (hearts.current >= hearts.max) return null;
  return Math.max(0, hearts.lastRegenAt + HEART_REGEN_MS - now);
}
