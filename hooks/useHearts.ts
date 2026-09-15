/**
 * Sincronización de vidas con el backend.
 *
 * La regeneración la calcula el servidor; el cliente solo pide el estado al
 * día. `useHeartsSync` se monta una sola vez en el layout raíz: refresca al
 * abrir la app y cada vez que vuelve a primer plano.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { msUntilNextHeart } from '@/lib/hearts';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';

export function useHeartsSync(): void {
  const refreshProgress = useProgressStore((state) => state.refreshProgress);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    void refreshProgress(token);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void refreshProgress(token);
    });

    return () => subscription.remove();
  }, [refreshProgress, token]);
}

/**
 * Cuenta atrás hasta el próximo corazón. Devuelve null si están llenos.
 * Solo tictaquea mientras falte alguno, para no renderizar de más.
 */
export function useNextHeartCountdown(): number | null {
  const hearts = useProgressStore((state) => state.hearts);
  const refreshProgress = useProgressStore((state) => state.refreshProgress);
  const token = useAuthStore((state) => state.token);
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
      // Al llegar a cero se le pregunta al backend si ya corresponde una vida nueva.
      if (remaining !== null && remaining <= 0) void refreshProgress(token);
    }, 1000);

    return () => clearInterval(interval);
  }, [hearts, refreshProgress, token]);

  return remainingMs;
}
