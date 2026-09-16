import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { detectPianoNotes, type PianoNoteReading } from '@/lib/pianoDetection';

type PianoDetectorStatus = 'idle' | 'requesting_permission' | 'listening' | 'permission_denied' | 'error' | 'stopped';

interface UsePianoDetectorOptions {
  enabled: boolean;
  onInputLevel?: (level: number) => void;
}

interface PianoDetectorResult {
  status: PianoDetectorStatus;
  notes: PianoNoteReading[];
  error: string | null;
  stop: () => void;
  reset: () => void;
}

const SAMPLE_RATE = 16_000;
const WINDOW_SAMPLES = 4096;
const ANALYSIS_INTERVAL_MS = 140;
const MAX_STALE_NOTES_MS = 500;

function appendSamples(previous: Float32Array, data: ArrayBuffer, channels: number): { samples: Float32Array; rms: number } {
  const interleaved = new Int16Array(data);
  const safeChannels = Math.max(1, channels);
  const frames = Math.floor(interleaved.length / safeChannels);
  const mono = new Float32Array(frames);
  let energy = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < safeChannels; channel += 1) {
      sum += (interleaved[frame * safeChannels + channel] ?? 0) / 32768;
    }
    const value = sum / safeChannels;
    mono[frame] = value;
    energy += value * value;
  }

  const retained = Math.min(previous.length, Math.max(0, WINDOW_SAMPLES - mono.length));
  const length = Math.min(WINDOW_SAMPLES, retained + mono.length);
  const samples = new Float32Array(length);
  if (retained > 0) samples.set(previous.subarray(previous.length - retained));
  samples.set(mono.subarray(Math.max(0, mono.length - (length - retained))), retained);
  return { samples, rms: frames > 0 ? Math.sqrt(energy / frames) : 0 };
}

function normalizedLevel(rms: number): number {
  if (rms <= 0.0001) return 0;
  return Math.max(0, Math.min(1, (20 * Math.log10(rms) + 55) / 40));
}

export function usePianoDetector({ enabled, onInputLevel }: UsePianoDetectorOptions): PianoDetectorResult {
  const [status, setStatus] = useState<PianoDetectorStatus>('idle');
  const [notes, setNotes] = useState<PianoNoteReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const samplesRef = useRef<Float32Array>(new Float32Array(0));
  const activeRef = useRef(false);
  const lastAnalysisAtRef = useRef(0);
  const lastDetectionAtRef = useRef(0);
  const smoothedLevelRef = useRef(0);
  const onInputLevelRef = useRef(onInputLevel);
  onInputLevelRef.current = onInputLevel;

  const reset = useCallback(() => {
    samplesRef.current = new Float32Array(0);
    lastAnalysisAtRef.current = 0;
    lastDetectionAtRef.current = 0;
    smoothedLevelRef.current = 0;
    setNotes([]);
    setError(null);
    onInputLevelRef.current?.(0);
  }, []);

  const handleBuffer = useCallback((buffer: { data: ArrayBuffer; sampleRate: number; channels: number }) => {
    if (!activeRef.current) return;
    const appended = appendSamples(samplesRef.current, buffer.data, buffer.channels);
    samplesRef.current = appended.samples;
    const level = normalizedLevel(appended.rms);
    smoothedLevelRef.current = smoothedLevelRef.current * 0.55 + level * 0.45;
    onInputLevelRef.current?.(smoothedLevelRef.current);

    const now = Date.now();
    if (samplesRef.current.length < WINDOW_SAMPLES || now - lastAnalysisAtRef.current < ANALYSIS_INTERVAL_MS) return;
    lastAnalysisAtRef.current = now;
    const detected = detectPianoNotes(samplesRef.current, buffer.sampleRate);
    if (detected.length > 0) {
      lastDetectionAtRef.current = now;
      setNotes(detected);
    } else if (now - lastDetectionAtRef.current > MAX_STALE_NOTES_MS) {
      setNotes([]);
    }
  }, []);

  const { stream } = useAudioStream({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    encoding: 'int16',
    onBuffer: handleBuffer,
  });

  const stop = useCallback(() => {
    activeRef.current = false;
    if (stream?.isStreaming) stream.stop();
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
    reset();
    setStatus('requesting_permission');
    void (async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('permission_denied');
          setError('Necesitamos permiso para usar el micrófono y escuchar el piano.');
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
  }, [enabled, reset, stop, stream]);

  return { status, notes, error, stop, reset };
}
