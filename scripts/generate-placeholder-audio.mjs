/**
 * Genera los clips WAV de marcador de posición usados por los ejercicios
 * `listen_and_choose`. Son tonos sintéticos: suficientes para probar el flujo,
 * pero se deben reemplazar por grabaciones reales del instrumento.
 *
 *   node scripts/generate-placeholder-audio.mjs
 *
 * Los archivos generados se versionan en assets/audio/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');
const SAMPLE_RATE = 22050;
const DEFAULT_DURATION_S = 1.4;
const DEFAULT_DECAY = 2.6;

/** Contenido armónico aproximado por familia de instrumento. */
const TIMBRES = {
  guitar: [1, 0.55, 0.32, 0.18, 0.09],
  piano: [1, 0.42, 0.2, 0.08],
  click: [1, 0.3],
};

const CLIPS = [
  { name: 'guitar-open-e2', frequency: 82.41, timbre: 'guitar' },
  { name: 'guitar-open-a2', frequency: 110.0, timbre: 'guitar' },
  { name: 'guitar-open-d3', frequency: 146.83, timbre: 'guitar' },
  { name: 'piano-c4', frequency: 261.63, timbre: 'piano' },
  { name: 'piano-g4', frequency: 392.0, timbre: 'piano' },
  // Clics del metrónomo: cortos y secos para que el ataque sea claro.
  { name: 'metronome-click', frequency: 1000, timbre: 'click', duration: 0.06, decay: 70 },
  { name: 'metronome-accent', frequency: 1500, timbre: 'click', duration: 0.07, decay: 60 },
];

function renderSamples(frequency, harmonics, durationS, decay) {
  const total = Math.floor(SAMPLE_RATE * durationS);
  const samples = new Float32Array(total);
  const attackSamples = Math.max(1, Math.floor(SAMPLE_RATE * 0.005));

  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    for (let h = 0; h < harmonics.length; h += 1) {
      value += harmonics[h] * Math.sin(2 * Math.PI * frequency * (h + 1) * t);
    }
    // Ataque corto para evitar el click inicial y decaimiento exponencial.
    const attack = Math.min(1, i / attackSamples);
    const envelope = Math.exp(-decay * t);
    samples[i] = value * attack * envelope;
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0) {
    for (let i = 0; i < total; i += 1) samples[i] = (samples[i] / peak) * 0.85;
  }
  return samples;
}

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // tamaño del bloque fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits por muestra
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const clip of CLIPS) {
  const samples = renderSamples(
    clip.frequency,
    TIMBRES[clip.timbre],
    clip.duration ?? DEFAULT_DURATION_S,
    clip.decay ?? DEFAULT_DECAY,
  );
  writeFileSync(join(OUT_DIR, `${clip.name}.wav`), toWav(samples));
  console.log(`✓ ${clip.name}.wav (${clip.frequency} Hz)`);
}
