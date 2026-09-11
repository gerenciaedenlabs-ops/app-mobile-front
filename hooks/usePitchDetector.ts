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
  capturedMs: number;
  progress: number;
  voiceDetected: boolean;
  completed: boolean;
}

export interface PitchEvaluation {
  correct: boolean;
  frequencyHz: number;
  cents: number;
  inTuneRatio: number;
  sampleCount: number;
}

export interface UsePitchDetectorOptions {
  target: PitchTarget;
  centsTolerance: number;
  /** null mantiene el detector abierto como afinador, sin evaluación final. */
  evaluationDurationMs: number | null;
  enabled: boolean;
  minFrequencyHz?: number;
  maxFrequencyHz?: number;
  /** Entrega la envolvente del micrófono sin forzar renders de React. */
  onInputLevel?: (level: number) => void;
  /** Canal inmediato para interfaces de afinación que no deben esperar un render de React. */
  onPitch?: (pitch: DetectedPitch | null) => void;
  onMatch?: (match: PitchTargetMatch) => void;
  onEvaluated?: (evaluation: PitchEvaluation) => void;
}

export interface PitchDetectorResult {
  status: PitchDetectorStatus;
  pitch: DetectedPitch | null;
  match: PitchTargetMatch;
  evaluation: PitchEvaluation | null;
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
const MINIMUM_AUDIBLE_LEVEL = 0.08;
const MAX_STALE_PITCH_MS = 350;
const IDLE_MATCH: PitchTargetMatch = {
  inTune: false,
  capturedMs: 0,
  progress: 0,
  voiceDetected: false,
  completed: false,
};

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
  evaluationDurationMs,
  enabled,
  minFrequencyHz = 70,
  maxFrequencyHz = 1100,
  onInputLevel,
  onPitch,
  onMatch,
  onEvaluated,
}: UsePitchDetectorOptions): PitchDetectorResult {
  const [status, setStatus] = useState<PitchDetectorStatus>('idle');
  const [pitch, setPitch] = useState<DetectedPitch | null>(null);
  const [match, setMatch] = useState<PitchTargetMatch>(IDLE_MATCH);
  const [evaluation, setEvaluation] = useState<PitchEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const samplesRef = useRef<Float32Array<ArrayBufferLike>>(new Float32Array(0));
  const pitchSnapshotRef = useRef<DetectedPitch | null>(null);
  const matchSnapshotRef = useRef<PitchTargetMatch>(IDLE_MATCH);
  const uiFrameRef = useRef<number | null>(null);
  const recentFrequenciesRef = useRef<number[]>([]);
  const lastAnalysisAtRef = useRef(0);
  const capturedMsRef = useRef(0);
  const captureStartedAtRef = useRef<number | null>(null);
  const evaluationReadingsRef = useRef<{ frequencyHz: number; cents: number; inTune: boolean }[]>([]);
  const lastPitchAtRef = useRef<number | null>(null);
  const pitchVisibleRef = useRef(false);
  const smoothedLevelRef = useRef(0);
  const completedRef = useRef(false);
  const activeRef = useRef(false);
  const onInputLevelRef = useRef(onInputLevel);
  const onPitchRef = useRef(onPitch);
  const onMatchRef = useRef(onMatch);
  const onEvaluatedRef = useRef(onEvaluated);
  onInputLevelRef.current = onInputLevel;
  onPitchRef.current = onPitch;
  onMatchRef.current = onMatch;
  onEvaluatedRef.current = onEvaluated;

  // Los eventos PCM llegan desde un emisor nativo. Publicar en el siguiente
  // frame evita que React agrupe todas las lecturas hasta el final del bloque.
  const publishUiSnapshot = useCallback(() => {
    if (uiFrameRef.current !== null) return;
    uiFrameRef.current = requestAnimationFrame(() => {
      uiFrameRef.current = null;
      setPitch(pitchSnapshotRef.current);
      setMatch(matchSnapshotRef.current);
    });
  }, []);

  const resetAnalysis = useCallback(() => {
    samplesRef.current = new Float32Array(0);
    if (uiFrameRef.current !== null) cancelAnimationFrame(uiFrameRef.current);
    uiFrameRef.current = null;
    pitchSnapshotRef.current = null;
    matchSnapshotRef.current = IDLE_MATCH;
    recentFrequenciesRef.current = [];
    lastAnalysisAtRef.current = 0;
    capturedMsRef.current = 0;
    captureStartedAtRef.current = null;
    evaluationReadingsRef.current = [];
    lastPitchAtRef.current = null;
    pitchVisibleRef.current = false;
    smoothedLevelRef.current = 0;
    completedRef.current = false;
    setPitch(null);
    setMatch(IDLE_MATCH);
    setEvaluation(null);
    onInputLevelRef.current?.(0);
    onPitchRef.current?.(null);
    onMatchRef.current?.(IDLE_MATCH);
  }, []);

  const restart = useCallback(() => {
    resetAnalysis();
    setError(null);
    setAttempt((value) => value + 1);
  }, [resetAnalysis]);

  const completeEvaluation = useCallback(() => {
    if (completedRef.current || evaluationDurationMs === null) return;
    completedRef.current = true;
    const readings = evaluationReadingsRef.current;
    const representativeFrequency = readings.length > 0
      ? median(readings.map((item) => item.frequencyHz))
      : 0;
    const representativeCents = readings.length > 0
      ? Math.round(centsFrom(representativeFrequency, target.frequencyHz))
      : 0;
    const inTuneRatio = readings.filter((item) => item.inTune).length / Math.max(1, readings.length);
    const finalEvaluation: PitchEvaluation = {
      correct: readings.length > 0 && Math.abs(representativeCents) <= centsTolerance,
      frequencyHz: representativeFrequency,
      cents: representativeCents,
      inTuneRatio,
      sampleCount: readings.length,
    };
    matchSnapshotRef.current = {
      ...matchSnapshotRef.current,
      capturedMs: evaluationDurationMs,
      progress: 1,
      completed: true,
    };
    onMatchRef.current?.(matchSnapshotRef.current);
    publishUiSnapshot();
    setEvaluation(finalEvaluation);
    onEvaluatedRef.current?.(finalEvaluation);
  }, [centsTolerance, evaluationDurationMs, publishUiSnapshot, target.frequencyHz]);

  const handleBuffer = useCallback(
    (buffer: { data: ArrayBuffer; sampleRate: number; channels: number }) => {
      if (!activeRef.current || completedRef.current) return;

      const appended = appendMonoSamples(samplesRef.current, buffer.data, buffer.channels);
      samplesRef.current = appended.samples;
      const rawLevel = normalizeInputLevel(appended.rms);
      const smoothedLevel = smoothedLevelRef.current * 0.55 + rawLevel * 0.45;
      smoothedLevelRef.current = smoothedLevel;
      onInputLevelRef.current?.(smoothedLevel);
      const now = Date.now();

      const soundDetected = rawLevel >= MINIMUM_AUDIBLE_LEVEL;
      let captureCompleted = false;
      if (evaluationDurationMs !== null) {
        if (captureStartedAtRef.current === null && soundDetected) {
          const bytesPerSample = 2;
          const frames = buffer.data.byteLength / bytesPerSample / Math.max(1, buffer.channels);
          const bufferDurationMs = (frames / buffer.sampleRate) * 1000;
          captureStartedAtRef.current = now - Math.min(bufferDurationMs, ANALYSIS_INTERVAL_MS);
        }
        if (captureStartedAtRef.current !== null) {
          capturedMsRef.current = Math.min(
            evaluationDurationMs,
            now - captureStartedAtRef.current,
          );
          captureCompleted = capturedMsRef.current >= evaluationDurationMs;
          matchSnapshotRef.current = {
            ...matchSnapshotRef.current,
            capturedMs: capturedMsRef.current,
            progress: capturedMsRef.current / evaluationDurationMs,
            voiceDetected: soundDetected,
            completed: captureCompleted,
          };
          onMatchRef.current?.(matchSnapshotRef.current);
          publishUiSnapshot();
        }
      }

      if (samplesRef.current.length < ANALYSIS_WINDOW_SAMPLES || now - lastAnalysisAtRef.current < ANALYSIS_INTERVAL_MS) {
        if (captureCompleted) completeEvaluation();
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
          pitchSnapshotRef.current = null;
          onPitchRef.current?.(null);
          publishUiSnapshot();
        }
        matchSnapshotRef.current = {
          ...matchSnapshotRef.current,
          inTune: false,
          voiceDetected: soundDetected,
        };
        onMatchRef.current?.(matchSnapshotRef.current);
        publishUiSnapshot();
        if (captureCompleted) completeEvaluation();
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

      pitchSnapshotRef.current = {
        frequencyHz,
        noteName: note.name,
        octave: note.octave,
        cents: Math.round(cents),
        confidence: reading.confidence,
        label: formatNote(note.name, note.octave),
      };
      onPitchRef.current?.(pitchSnapshotRef.current);

      const validVoice = reading.confidence >= MINIMUM_VALIDATION_CONFIDENCE;
      if (validVoice && evaluationDurationMs !== null && captureStartedAtRef.current !== null) {
        evaluationReadingsRef.current.push({ frequencyHz, cents, inTune });
      }

      matchSnapshotRef.current = {
        inTune,
        capturedMs: capturedMsRef.current,
        progress:
          evaluationDurationMs === null ? 0 : capturedMsRef.current / evaluationDurationMs,
        voiceDetected: evaluationDurationMs === null ? validVoice : soundDetected,
        completed: captureCompleted,
      };
      onMatchRef.current?.(matchSnapshotRef.current);
      publishUiSnapshot();

      if (captureCompleted) completeEvaluation();
    },
    [
      target.frequencyHz,
      centsTolerance,
      evaluationDurationMs,
      minFrequencyHz,
      maxFrequencyHz,
      completeEvaluation,
      publishUiSnapshot,
    ],
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

  return { status, pitch, match, evaluation, error, restart, stop };
}
