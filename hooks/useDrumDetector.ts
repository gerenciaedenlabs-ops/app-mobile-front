import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { classifyDrumHit, type DrumHitAnalysis } from '@/lib/drumDetection';

export type DrumDetectorStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'permission_denied'
  | 'error'
  | 'stopped';

export interface DetectedDrumHit extends DrumHitAnalysis {
  id: number;
  timestamp: number;
  level: number;
}

interface UseDrumDetectorOptions {
  enabled: boolean;
  onHit?: (hit: DetectedDrumHit) => void;
}

const SAMPLE_RATE = 16_000;
const MIN_ONSET_RMS = 0.018;
const MIN_HIT_GAP_MS = 110;

function decodeMono(buffer: ArrayBuffer, channels: number) {
  const pcm = new Int16Array(buffer);
  const safeChannels = Math.max(1, channels);
  const frameCount = Math.floor(pcm.length / safeChannels);
  const samples = new Float32Array(frameCount);
  let energy = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < safeChannels; channel += 1) {
      sum += (pcm[frame * safeChannels + channel] ?? 0) / 32768;
    }
    const value = sum / safeChannels;
    samples[frame] = value;
    energy += value * value;
  }
  return { samples, rms: Math.sqrt(energy / Math.max(1, frameCount)) };
}

function normalizedLevel(rms: number) {
  if (rms <= 0.0001) return 0;
  return Math.max(0, Math.min(1, (20 * Math.log10(rms) + 55) / 42));
}

function median(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function useDrumDetector({ enabled, onHit }: UseDrumDetectorOptions) {
  const [status, setStatus] = useState<DrumDetectorStatus>('idle');
  const [latestHit, setLatestHit] = useState<DetectedDrumHit | null>(null);
  const [history, setHistory] = useState<DetectedDrumHit[]>([]);
  const [inputLevel, setInputLevel] = useState(0);
  const [tempoBpm, setTempoBpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef(false);
  const previousRmsRef = useRef(0);
  const noiseFloorRef = useRef(0.004);
  const lastHitAtRef = useRef(0);
  const hitTimesRef = useRef<number[]>([]);
  const hitIdRef = useRef(0);
  const uiFrameRef = useRef<number | null>(null);
  const nextLevelRef = useRef(0);
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;

  const publishLevel = useCallback((level: number) => {
    nextLevelRef.current = nextLevelRef.current * 0.5 + level * 0.5;
    if (uiFrameRef.current !== null) return;
    uiFrameRef.current = requestAnimationFrame(() => {
      uiFrameRef.current = null;
      setInputLevel(nextLevelRef.current);
    });
  }, []);

  const reset = useCallback(() => {
    previousRmsRef.current = 0;
    noiseFloorRef.current = 0.004;
    lastHitAtRef.current = 0;
    hitTimesRef.current = [];
    setLatestHit(null);
    setHistory([]);
    setTempoBpm(null);
    setInputLevel(0);
  }, []);

  const handleBuffer = useCallback(
    (buffer: { data: ArrayBuffer; sampleRate: number; channels: number }) => {
      if (!activeRef.current) return;
      const { samples, rms } = decodeMono(buffer.data, buffer.channels);
      publishLevel(normalizedLevel(rms));

      const previousRms = previousRmsRef.current;
      previousRmsRef.current = rms;
      if (rms < noiseFloorRef.current * 1.8) {
        noiseFloorRef.current = noiseFloorRef.current * 0.97 + rms * 0.03;
      }

      const now = Date.now();
      const threshold = Math.max(MIN_ONSET_RMS, noiseFloorRef.current * 3.2);
      const rise = rms / Math.max(0.003, previousRms);
      if (rms < threshold || rise < 1.45 || now - lastHitAtRef.current < MIN_HIT_GAP_MS) return;

      lastHitAtRef.current = now;
      const hit: DetectedDrumHit = {
        ...classifyDrumHit(samples, buffer.sampleRate),
        id: (hitIdRef.current += 1),
        timestamp: now,
        level: normalizedLevel(rms),
      };
      hitTimesRef.current = [...hitTimesRef.current.slice(-7), now];
      const intervals = hitTimesRef.current
        .slice(1)
        .map((time, index) => time - (hitTimesRef.current[index] ?? time))
        .filter((interval) => interval >= 250 && interval <= 2000);
      setTempoBpm(intervals.length >= 2 ? Math.round(60_000 / median(intervals)) : null);
      setLatestHit(hit);
      setHistory((items) => [hit, ...items].slice(0, 12));
      onHitRef.current?.(hit);
    },
    [publishLevel],
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
    setStatus('stopped');
    publishLevel(0);
  }, [publishLevel, stream]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    let cancelled = false;
    activeRef.current = true;
    reset();
    setError(null);
    setStatus('requesting_permission');

    void (async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('permission_denied');
          setError('Necesitamos permiso para escuchar los golpes de batería.');
          return;
        }
        if (!stream) throw new Error('La captura PCM no está disponible en esta plataforma.');
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await stream.start();
        if (cancelled) return;
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
      if (uiFrameRef.current !== null) cancelAnimationFrame(uiFrameRef.current);
      void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    };
  }, [enabled, reset, stop, stream]);

  return { status, latestHit, history, inputLevel, tempoBpm, error, reset, stop };
}
