/**
 * Sincronización de vidas con el reloj.
 *
 * `useHeartsSync` se monta una sola vez en el layout raíz: pone al día los
 * corazones al abrir la app y cada vez que vuelve a primer plano.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { msUntilNextHeart } from '@/lib/hearts';
import { useProgressStore } from '@/store/progressStore';

export function useHeartsSync(): void {
  const syncTimeBasedState = useProgressStore((state) => state.syncTimeBasedState);

  useEffect(() => {
    syncTimeBasedState();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') syncTimeBasedState();
    });

    return () => subscription.remove();
  }, [syncTimeBasedState]);
}

/**
 * Cuenta atrás hasta el próximo corazón. Devuelve null si están llenos.
 * Solo tictaquea mientras falte alguno, para no renderizar de más.
 */
export function useNextHeartCountdown(): number | null {
  const hearts = useProgressStore((state) => state.hearts);
  const syncTimeBasedState = useProgressStore((state) => state.syncTimeBasedState);
  const [remainingMs, setRemainingMs] = useState(() => msUntilNextHeart(hearts));

  useEffect(() => {
    if (hearts.current >= hearts.max) {
      setRemainingMs(null);
      return;
    }

    setRemainingMs(msUntilNextHeart(hearts));

    const interval = setInterval(() => {
      const remaining = msUntilNextHeart(hearts);
      setRemainingMs(remaining);
      // Al llegar a cero el store recalcula y este efecto se vuelve a montar.
      if (remaining !== null && remaining <= 0) syncTimeBasedState();
    }, 1000);

    return () => clearInterval(interval);
  }, [hearts, syncTimeBasedState]);

  return remainingMs;
}
