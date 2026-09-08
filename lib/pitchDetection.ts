export interface FundamentalFrequencyOptions {
  minFrequencyHz?: number;
  maxFrequencyHz?: number;
  yinThreshold?: number;
  minimumRms?: number;
}

export interface FundamentalFrequencyReading {
  frequencyHz: number;
  confidence: number;
  rms: number;
}

const DEFAULT_MIN_FREQUENCY_HZ = 70;
const DEFAULT_MAX_FREQUENCY_HZ = 1100;
const DEFAULT_YIN_THRESHOLD = 0.15;
const DEFAULT_MINIMUM_RMS = 0.012;

/**
 * Detecta la frecuencia fundamental de una señal monofónica mediante YIN.
 *
 * Esta función es pura e independiente del micrófono para poder reutilizarla
 * después en afinación, registro, estabilidad y cálculo de rango vocal.
 */
export function detectFundamentalFrequency(
  samples: Float32Array,
  sampleRate: number,
  options: FundamentalFrequencyOptions = {},
): FundamentalFrequencyReading | null {
  const minFrequencyHz = options.minFrequencyHz ?? DEFAULT_MIN_FREQUENCY_HZ;
  const maxFrequencyHz = options.maxFrequencyHz ?? DEFAULT_MAX_FREQUENCY_HZ;
  const yinThreshold = options.yinThreshold ?? DEFAULT_YIN_THRESHOLD;
  const minimumRms = options.minimumRms ?? DEFAULT_MINIMUM_RMS;

  if (samples.length < 256 || sampleRate <= 0 || minFrequencyHz <= 0 || maxFrequencyHz <= minFrequencyHz) {
    return null;
  }

  let mean = 0;
  for (let index = 0; index < samples.length; index += 1) mean += samples[index] ?? 0;
  mean /= samples.length;

  const centered = new Float32Array(samples.length);
  let energy = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const value = (samples[index] ?? 0) - mean;
    centered[index] = value;
    energy += value * value;
  }

  const rms = Math.sqrt(energy / centered.length);
  if (rms < minimumRms) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequencyHz));
  const maxTau = Math.min(Math.floor(sampleRate / minFrequencyHz), Math.floor(centered.length / 2));
  if (maxTau <= minTau) return null;

  const difference = new Float32Array(maxTau + 1);
  const comparisonLength = centered.length - maxTau;

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let index = 0; index < comparisonLength; index += 1) {
      const delta = (centered[index] ?? 0) - (centered[index + tau] ?? 0);
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  const cumulativeMeanNormalized = new Float32Array(maxTau + 1);
  cumulativeMeanNormalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau] ?? 0;
    cumulativeMeanNormalized[tau] = runningSum === 0 ? 1 : ((difference[tau] ?? 0) * tau) / runningSum;
  }

  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if ((cumulativeMeanNormalized[tau] ?? 1) >= yinThreshold) continue;
    while (
      tau + 1 <= maxTau &&
      (cumulativeMeanNormalized[tau + 1] ?? 1) < (cumulativeMeanNormalized[tau] ?? 1)
    ) {
      tau += 1;
    }
    tauEstimate = tau;
    break;
  }

  if (tauEstimate < 0) return null;

  const previous = cumulativeMeanNormalized[tauEstimate - 1] ?? cumulativeMeanNormalized[tauEstimate] ?? 1;
  const current = cumulativeMeanNormalized[tauEstimate] ?? 1;
  const next = cumulativeMeanNormalized[tauEstimate + 1] ?? current;
  const denominator = 2 * (2 * current - next - previous);
  const adjustment = denominator === 0 ? 0 : (next - previous) / denominator;
  const refinedTau = tauEstimate + Math.max(-1, Math.min(1, adjustment));
  const frequencyHz = sampleRate / refinedTau;

  if (!Number.isFinite(frequencyHz) || frequencyHz < minFrequencyHz || frequencyHz > maxFrequencyHz) {
    return null;
  }

  return {
    frequencyHz,
    confidence: Math.max(0, Math.min(1, 1 - current)),
    rms,
  };
}

