/**
 * Utilidades de afinación (temperamento igual, A4 = 440 Hz).
 *
 * Son puras y no dependen del micrófono: las usa el detector simulado y las
 * seguirá usando la implementación real para convertir Hz → nota y calcular
 * la desviación en cents.
 */

export const A4_HZ = 440;
const A4_MIDI = 69;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

export interface NoteReading {
  name: NoteName;
  octave: number;
  /** Desviación respecto a la nota más cercana: negativo = bajo (calado). */
  cents: number;
}

export function midiToFrequency(midi: number): number {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / 12);
}

export function frequencyToMidi(frequencyHz: number): number {
  return A4_MIDI + 12 * Math.log2(frequencyHz / A4_HZ);
}

export function noteToFrequency(name: string, octave: number): number | null {
  const index = NOTE_NAMES.indexOf(name as NoteName);
  if (index < 0) return null;
  // MIDI 12 = C0, por eso el desplazamiento de una octava.
  return midiToFrequency((octave + 1) * 12 + index);
}

/** Hz → nota más cercana + desviación. */
export function frequencyToNote(frequencyHz: number): NoteReading | null {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) return null;

  const midi = frequencyToMidi(frequencyHz);
  const nearest = Math.round(midi);
  const name = NOTE_NAMES[((nearest % 12) + 12) % 12];
  if (!name) return null;

  return {
    name,
    octave: Math.floor(nearest / 12) - 1,
    cents: Math.round((midi - nearest) * 100),
  };
}

/** Distancia en cents de `frequencyHz` respecto a `referenceHz`. */
export function centsFrom(frequencyHz: number, referenceHz: number): number {
  if (frequencyHz <= 0 || referenceHz <= 0) return Number.POSITIVE_INFINITY;
  return 1200 * Math.log2(frequencyHz / referenceHz);
}

/** Nombre legible: "E2", "C#4". */
export function formatNote(name: string, octave: number): string {
  return `${name}${octave}`;
}
