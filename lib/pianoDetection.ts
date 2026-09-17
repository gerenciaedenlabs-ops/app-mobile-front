import { formatNote, midiToFrequency, NOTE_NAMES, type NoteName } from '@/lib/pitch';

export interface PianoNoteReading {
  midi: number;
  name: NoteName;
  octave: number;
  label: string;
  frequencyHz: number;
  confidence: number;
  energy: number;
}

export interface PianoDetectionOptions {
  minMidi?: number;
  maxMidi?: number;
  maxNotes?: number;
  minimumRms?: number;
}

const DEFAULT_MIN_MIDI = 36; // C2: rango práctico para el micrófono de un teléfono.
const DEFAULT_MAX_MIDI = 96; // C7.
const DEFAULT_MAX_NOTES = 4;
const DEFAULT_MINIMUM_RMS = 0.009;

function goertzelPower(samples: Float32Array, sampleRate: number, frequencyHz: number): number {
  const omega = (2 * Math.PI * frequencyHz) / sampleRate;
  const coefficient = 2 * Math.cos(omega);
  let previous = 0;
  let previousPrevious = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const current = (samples[index] ?? 0) + coefficient * previous - previousPrevious;
    previousPrevious = previous;
    previous = current;
  }

  const power = previousPrevious * previousPrevious
    + previous * previous
    - coefficient * previous * previousPrevious;
  return Math.max(0, power / (samples.length * samples.length));
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Detector espectral de varias teclas para piano. Analiza una parrilla de notas
 * temperadas y combina fundamental + armónicos. Está pensado para diagnóstico
 * en tiempo real, no para sustituir una transcripción MIDI profesional.
 */
export function detectPianoNotes(
  input: Float32Array,
  sampleRate: number,
  options: PianoDetectionOptions = {},
): PianoNoteReading[] {
  const minMidi = options.minMidi ?? DEFAULT_MIN_MIDI;
  const maxMidi = options.maxMidi ?? DEFAULT_MAX_MIDI;
  const maxNotes = options.maxNotes ?? DEFAULT_MAX_NOTES;
  const minimumRms = options.minimumRms ?? DEFAULT_MINIMUM_RMS;
  if (input.length < 1024 || sampleRate <= 0 || minMidi > maxMidi || maxNotes <= 0) return [];

  let mean = 0;
  for (let index = 0; index < input.length; index += 1) mean += input[index] ?? 0;
  mean /= input.length;

  const windowed = new Float32Array(input.length);
  let energy = 0;
  for (let index = 0; index < input.length; index += 1) {
    const centered = (input[index] ?? 0) - mean;
    energy += centered * centered;
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / Math.max(1, input.length - 1));
    windowed[index] = centered * hann;
  }
  const rms = Math.sqrt(energy / input.length);
  if (rms < minimumRms) return [];

  const bins: Array<{ midi: number; frequencyHz: number; energy: number }> = [];
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    const frequencyHz = midiToFrequency(midi);
    if (frequencyHz >= sampleRate * 0.48) break;
    const fundamental = goertzelPower(windowed, sampleRate, frequencyHz);
    const second = frequencyHz * 2 < sampleRate * 0.48
      ? goertzelPower(windowed, sampleRate, frequencyHz * 2)
      : 0;
    const third = frequencyHz * 3 < sampleRate * 0.48
      ? goertzelPower(windowed, sampleRate, frequencyHz * 3)
      : 0;
    bins.push({ midi, frequencyHz, energy: fundamental + second * 0.32 + third * 0.16 });
  }

  const energies = bins.map((bin) => bin.energy);
  const strongest = Math.max(0, ...energies);
  if (strongest <= 0) return [];
  const noiseFloor = median(energies);
  const threshold = Math.max(noiseFloor * 7, strongest * 0.11, 1e-8);

  const candidates = bins
    .filter((bin, index) => {
      const left = bins[index - 1]?.energy ?? 0;
      const right = bins[index + 1]?.energy ?? 0;
      return bin.energy >= threshold && bin.energy >= left && bin.energy >= right;
    })
    .sort((left, right) => right.energy - left.energy);

  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    const isWeakHarmonic = selected.some((lower) => {
      if (lower.frequencyHz >= candidate.frequencyHz) return false;
      const ratio = candidate.frequencyHz / lower.frequencyHz;
      const harmonic = Math.round(ratio);
      if (harmonic < 2 || harmonic > 6) return false;
      const distanceCents = Math.abs(1200 * Math.log2(ratio / harmonic));
      return distanceCents < 28 && candidate.energy < lower.energy * 0.5;
    });
    if (!isWeakHarmonic) selected.push(candidate);
    if (selected.length >= maxNotes) break;
  }

  return selected
    .sort((left, right) => left.midi - right.midi)
    .map((candidate) => {
      const noteIndex = ((candidate.midi % 12) + 12) % 12;
      const name = NOTE_NAMES[noteIndex] ?? 'C';
      const octave = Math.floor(candidate.midi / 12) - 1;
      return {
        midi: candidate.midi,
        name,
        octave,
        label: formatNote(name, octave),
        frequencyHz: candidate.frequencyHz,
        confidence: Math.max(0, Math.min(1, candidate.energy / strongest)),
        energy: candidate.energy,
      };
    });
}
