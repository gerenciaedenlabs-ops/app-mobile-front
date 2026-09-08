import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { centsFrom, formatNote, frequencyToNote } from '@/lib/pitch';
import { detectFundamentalFrequency } from '@/lib/pitchDetection';

export type PitchDetectorStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'permission_denied'
  | 'error'
  | 'stopped';

export interface PitchTarget {
  name: string;
  octave: number;
  frequencyHz: number;
}

export interface DetectedPitch {
  frequencyHz: number;
  noteName: string;
  octave: number;
  /** Desviación respecto al objetivo. Negativo = grave; positivo = agudo. */
  cents: number;
  confidence: number;
  label: string;
}

export interface PitchTargetMatch {
  inTune: boolean;
  heldMs: number;
  progress: number;
  achieved: boolean;
}

export interface UsePitchDetectorOptions {
  target: PitchTarget;
  centsTolerance: number;
  holdMs: number;
  enabled: boolean;
  minFrequencyHz?: number;
  maxFrequencyHz?: number;
  /** Entrega la envolvente del micrófono sin forzar renders de React. */
  onInputLevel?: (level: number) => void;
  onAchieved?: () => void;
}

export interface PitchDetectorResult {
  status: PitchDetectorStatus;
  pitch: DetectedPitch | null;
  match: PitchTargetMatch;
  error: string | null;
  restart: () => void;
  stop: () => void;
}

// 16 kHz conserva de sobra el rango vocal y reduce drásticamente el trabajo de YIN.
const SAMPLE_RATE = 16_000;
const ANALYSIS_WINDOW_SAMPLES = 2048;
const ANALYSIS_INTERVAL_MS = 95;
const MINIMUM_DISPLAY_CONFIDENCE = 0.5;
const MINIMUM_VALIDATION_CONFIDENCE = 0.7;
const MAX_UNVOICED_GAP_MS = 160;
const MAX_STALE_PITCH_MS = 350;
const IDLE_MATCH: PitchTargetMatch = { inTune: false, heldMs: 0, progress: 0, achieved: false };

interface AppendedSamples {
  samples: Float32Array<ArrayBufferLike>;
  rms: number;
}

function appendMonoSamples(
  previous: Float32Array<ArrayBufferLike>,
  buffer: ArrayBuffer,
  channels: number,
): AppendedSamples {
  const interleaved = new Int16Array(buffer);
  const safeChannels = Math.max(1, channels);
  const frameCount = Math.floor(interleaved.length / safeChannels);
  const mono = new Float32Array(frameCount);
  let energy = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < safeChannels; channel += 1) {
      sum += (interleaved[frame * safeChannels + channel] ?? 0) / 32768;
    }
    const value = sum / safeChannels;
    mono[frame] = value;
    energy += value * value;
  }

  const retained = Math.min(previous.length, Math.max(0, ANALYSIS_WINDOW_SAMPLES - mono.length));
  const combinedLength = Math.min(ANALYSIS_WINDOW_SAMPLES, retained + mono.length);
  const combined = new Float32Array(combinedLength);
  if (retained > 0) combined.set(previous.subarray(previous.length - retained), 0);
  combined.set(mono.subarray(Math.max(0, mono.length - (combinedLength - retained))), retained);
  return { samples: combined, rms: frameCount > 0 ? Math.sqrt(energy / frameCount) : 0 };
}

function normalizeInputLevel(rms: number): number {
  if (rms <= 0.0001) return 0;
  const decibels = 20 * Math.log10(rms);
  return Math.max(0, Math.min(1, (decibels + 55) / 40));
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function usePitchDetector({
  target,
  centsTolerance,
  holdMs,
  enabled,
  minFrequencyHz = 70,
  maxFrequencyHz = 1100,
  onInputLevel,
  onAchieved,
}: UsePitchDetectorOptions): PitchDetectorResult {
  const [status, setStatus] = useState<PitchDetectorStatus>('idle');
  const [pitch, setPitch] = useState<DetectedPitch | null>(null);
  const [match, setMatch] = useState<PitchTargetMatch>(IDLE_MATCH);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const samplesRef = useRef<Float32Array<ArrayBufferLike>>(new Float32Array(0));
  const recentFrequenciesRef = useRef<number[]>([]);
  const lastAnalysisAtRef = useRef(0);
  const holdStartedAtRef = useRef<number | null>(null);
  const lastInTuneAtRef = useRef<number | null>(null);
  const lastPitchAtRef = useRef<number | null>(null);
  const pitchVisibleRef = useRef(false);
  const smoothedLevelRef = useRef(0);
  const achievedRef = useRef(false);
  const activeRef = useRef(false);
  const onInputLevelRef = useRef(onInputLevel);
  const onAchievedRef = useRef(onAchieved);
  onInputLevelRef.current = onInputLevel;
  onAchievedRef.current = onAchieved;

  const resetAnalysis = useCallback(() => {
    samplesRef.current = new Float32Array(0);
    recentFrequenciesRef.current = [];
    lastAnalysisAtRef.current = 0;
    holdStartedAtRef.current = null;
    lastInTuneAtRef.current = null;
    lastPitchAtRef.current = null;
    pitchVisibleRef.current = false;
    smoothedLevelRef.current = 0;
    achievedRef.current = false;
    setPitch(null);
    setMatch(IDLE_MATCH);
    onInputLevelRef.current?.(0);
  }, []);

  const restart = useCallback(() => {
    resetAnalysis();
    setError(null);
    setAttempt((value) => value + 1);
  }, [resetAnalysis]);

  const handleBuffer = useCallback(
    (buffer: { data: ArrayBuffer; sampleRate: number; channels: number }) => {
      if (!activeRef.current || achievedRef.current) return;

      const appended = appendMonoSamples(samplesRef.current, buffer.data, buffer.channels);
      samplesRef.current = appended.samples;
      const rawLevel = normalizeInputLevel(appended.rms);
      const smoothedLevel = smoothedLevelRef.current * 0.55 + rawLevel * 0.45;
      smoothedLevelRef.current = smoothedLevel;
      onInputLevelRef.current?.(smoothedLevel);
      const now = Date.now();
      if (samplesRef.current.length < ANALYSIS_WINDOW_SAMPLES || now - lastAnalysisAtRef.current < ANALYSIS_INTERVAL_MS) {
        return;
      }
      lastAnalysisAtRef.current = now;

      const reading = detectFundamentalFrequency(samplesRef.current, buffer.sampleRate, {
        minFrequencyHz,
        maxFrequencyHz,
        // Permite mostrar una aproximación antes de que sea fiable para evaluar.
        yinThreshold: 0.25,
      });

      if (!reading || reading.confidence < MINIMUM_DISPLAY_CONFIDENCE) {
        if (
          pitchVisibleRef.current &&
          lastPitchAtRef.current !== null &&
          now - lastPitchAtRef.current > MAX_STALE_PITCH_MS
        ) {
          pitchVisibleRef.current = false;
          recentFrequenciesRef.current = [];
          setPitch(null);
        }
        if (lastInTuneAtRef.current !== null && now - lastInTuneAtRef.current > MAX_UNVOICED_GAP_MS) {
          holdStartedAtRef.current = null;
          lastInTuneAtRef.current = null;
          setMatch(IDLE_MATCH);
        }
        return;
      }

      lastPitchAtRef.current = now;
      pitchVisibleRef.current = true;
      recentFrequenciesRef.current = [...recentFrequenciesRef.current.slice(-2), reading.frequencyHz];
      const frequencyHz = median(recentFrequenciesRef.current);
      const note = frequencyToNote(frequencyHz);
      if (!note) return;

      const cents = centsFrom(frequencyHz, target.frequencyHz);
      const inTune =
        reading.confidence >= MINIMUM_VALIDATION_CONFIDENCE && Math.abs(cents) <= centsTolerance;

      setPitch({
        frequencyHz,
        noteName: note.name,
        octave: note.octave,
        cents: Math.round(cents),
        confidence: reading.confidence,
        label: formatNote(note.name, note.octave),
      });

      if (!inTune) {
        holdStartedAtRef.current = null;
        lastInTuneAtRef.current = null;
        setMatch(IDLE_MATCH);
        return;
      }

      if (
        holdStartedAtRef.current === null ||
        lastInTuneAtRef.current === null ||
        now - lastInTuneAtRef.current > MAX_UNVOICED_GAP_MS
      ) {
        holdStartedAtRef.current = now;
      }
      lastInTuneAtRef.current = now;

      const heldMs = Math.min(holdMs, now - (holdStartedAtRef.current ?? now));
      const achieved = heldMs >= holdMs;
      setMatch({ inTune: true, heldMs, progress: heldMs / holdMs, achieved });

      if (achieved && !achievedRef.current) {
        achievedRef.current = true;
        onAchievedRef.current?.();
      }
    },
    [target.frequencyHz, centsTolerance, holdMs, minFrequencyHz, maxFrequencyHz],
  );

  const { stream } = useAudioStream({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    encoding: 'int16',
    onBuffer: handleBuffer,
  });

  const stop = useCallback(() => {
    activeRef.current = false;
    if (stream?.isStreaming) stream.stop();
    smoothedLevelRef.current = 0;
    onInputLevelRef.current?.(0);
    setStatus('stopped');
  }, [stream]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    let cancelled = false;
    activeRef.current = true;
    resetAnalysis();
    setError(null);
    setStatus('requesting_permission');

    void (async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('permission_denied');
          setError('Necesitamos permiso para usar el micrófono y escuchar tu voz.');
          return;
        }

        if (!stream) throw new Error('La captura PCM en tiempo real no está disponible en esta plataforma.');
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await stream.start();
        if (cancelled) {
          stream.stop();
          return;
        }
        setStatus('listening');
      } catch (cause) {
        if (cancelled) return;
        setStatus('error');
        setError(cause instanceof Error ? cause.message : 'No se pudo iniciar el micrófono.');
      }
    })();

    return () => {
      cancelled = true;
      stop();
      void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    };
  }, [enabled, attempt, stream, resetAnalysis, stop]);

  return { status, pitch, match, error, restart, stop };
}
