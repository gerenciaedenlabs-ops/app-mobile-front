export type DrumHitType = 'kick' | 'snare' | 'hihat';

export interface DrumHitAnalysis {
  type: DrumHitType;
  confidence: number;
  lowRatio: number;
  midRatio: number;
  highRatio: number;
  zeroCrossingRate: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function goertzelPower(samples: Float32Array<ArrayBufferLike>, sampleRate: number, frequency: number) {
  const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / sampleRate);
  let previous = 0;
  let previousPrevious = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const current = (samples[index] ?? 0) + coefficient * previous - previousPrevious;
    previousPrevious = previous;
    previous = current;
  }
  return Math.max(0, previousPrevious ** 2 + previous ** 2 - coefficient * previous * previousPrevious);
}

function bandPower(
  samples: Float32Array<ArrayBufferLike>,
  sampleRate: number,
  frequencies: readonly number[],
) {
  return frequencies.reduce((sum, frequency) => sum + goertzelPower(samples, sampleRate, frequency), 0);
}

/**
 * Clasificador ligero pensado para golpes aislados. No intenta reconocer un kit
 * concreto: compara energía grave/media/aguda y densidad de cruces por cero.
 */
export function classifyDrumHit(
  input: Float32Array<ArrayBufferLike>,
  sampleRate: number,
): DrumHitAnalysis {
  const windowSize = Math.min(1024, input.length);
  const samples = input.subarray(0, windowSize);
  let mean = 0;
  for (let index = 0; index < samples.length; index += 1) mean += samples[index] ?? 0;
  mean /= Math.max(1, samples.length);

  const centered = new Float32Array(samples.length);
  let zeroCrossings = 0;
  for (let index = 0; index < samples.length; index += 1) {
    centered[index] = (samples[index] ?? 0) - mean;
    if (
      index > 0 &&
      Math.sign(centered[index] ?? 0) !== Math.sign(centered[index - 1] ?? 0)
    ) zeroCrossings += 1;
  }

  const low = bandPower(centered, sampleRate, [55, 80, 110, 160]);
  const mid = bandPower(centered, sampleRate, [280, 500, 900, 1600, 2400]);
  const high = bandPower(centered, sampleRate, [3200, 4500, 6000, 7200]);
  const total = Math.max(Number.EPSILON, low + mid + high);
  const lowRatio = low / total;
  const midRatio = mid / total;
  const highRatio = high / total;
  const zeroCrossingRate = zeroCrossings / Math.max(1, centered.length - 1);

  if (lowRatio >= 0.5 && zeroCrossingRate < 0.18) {
    return {
      type: 'kick',
      confidence: clamp01(0.48 + (lowRatio - 0.5) * 1.4),
      lowRatio,
      midRatio,
      highRatio,
      zeroCrossingRate,
    };
  }
  if (highRatio >= 0.42 && lowRatio < 0.25) {
    return {
      type: 'hihat',
      confidence: clamp01(0.48 + (highRatio - 0.42) * 1.5),
      lowRatio,
      midRatio,
      highRatio,
      zeroCrossingRate,
    };
  }
  return {
    type: 'snare',
    confidence: clamp01(0.5 + midRatio * 0.35),
    lowRatio,
    midRatio,
    highRatio,
    zeroCrossingRate,
  };
}

export const DRUM_LABELS: Record<DrumHitType, string> = {
  kick: 'Bombo',
  snare: 'Caja',
  hihat: 'Hi-hat',
};
