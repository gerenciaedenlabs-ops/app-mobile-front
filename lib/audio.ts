/**
 * Registry de clips locales.
 *
 * Los ejercicios referencian una CLAVE, nunca una ruta: así el contenido no
 * depende de la estructura de carpetas y una clave rota se detecta aquí en vez
 * de reventar el bundler.
 *
 * TODO(audio): los .wav actuales son tonos sintéticos generados por
 * `scripts/generate-placeholder-audio.mjs`. Sustituir por grabaciones reales.
 */
import type { AudioSource } from 'expo-audio';

const CLIPS = {
  'guitar-open-e2': require('../assets/audio/guitar-open-e2.wav') as number,
  'guitar-open-a2': require('../assets/audio/guitar-open-a2.wav') as number,
  'guitar-open-d3': require('../assets/audio/guitar-open-d3.wav') as number,
  'piano-c4': require('../assets/audio/piano-c4.wav') as number,
  'piano-g4': require('../assets/audio/piano-g4.wav') as number,
  'metronome-click': require('../assets/audio/metronome-click.wav') as number,
  'metronome-accent': require('../assets/audio/metronome-accent.wav') as number,
} satisfies Record<string, number>;

export type AudioClipKey = keyof typeof CLIPS;

export function isAudioClipKey(key: string): key is AudioClipKey {
  return Object.prototype.hasOwnProperty.call(CLIPS, key);
}

/** null cuando la clave no existe: el ejercicio muestra un estado de error. */
export function getAudioClip(key: string): AudioSource | null {
  return isAudioClipKey(key) ? CLIPS[key] : null;
}

export const METRONOME_CLICK: AudioSource = CLIPS['metronome-click'];
export const METRONOME_ACCENT: AudioSource = CLIPS['metronome-accent'];
