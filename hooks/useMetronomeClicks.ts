/**
 * Clic audible del metrónomo.
 *
 * Dos reproductores precargados: uno para el pulso y otro para el acento del
 * primer tiempo del compás. Crear un player por golpe metería un retardo
 * inaceptable en un ejercicio de ritmo.
 */
import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

import { METRONOME_ACCENT, METRONOME_CLICK } from '@/lib/audio';

export function useMetronomeClicks(): (accent?: boolean) => void {
  const click = useAudioPlayer(METRONOME_CLICK);
  const accent = useAudioPlayer(METRONOME_ACCENT);

  return useCallback(
    (isAccent = false) => {
      const player = isAccent ? accent : click;
      void player.seekTo(0).then(() => player.play());
    },
    [accent, click],
  );
}
