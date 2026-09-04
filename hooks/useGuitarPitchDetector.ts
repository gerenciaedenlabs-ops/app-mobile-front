/**
 * ⚠️ MOCK — no toca el micrófono.
 *
 * Este hook define el CONTRATO que consumirá la detección real. La
 * implementación auténtica debe:
 *   1. pedir permiso con `requestRecordingPermissionsAsync()` de expo-audio;
 *   2. abrir un stream de audio (expo-audio con sampling habilitado, o un
 *      módulo nativo/JSI propio);
 *   3. estimar la frecuencia (YIN / autocorrelación) para `kind: 'note'`, y
 *      un análisis de croma o un detector polifónico para `kind: 'chord'`;
 *   4. mantener EXACTAMENTE la firma de `GuitarPitchDetector`.
 *
 * Mientras tanto simula una búsqueda que converge hacia el objetivo, para que
 * la pantalla del ejercicio se pueda desarrollar y probar en Expo Go.
 *
 * TODO(audio): reemplazar la simulación por el análisis real del micrófono.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { centsFrom, formatNote, frequencyToNote, noteToFrequency } from '@/lib/pitch';
import type { ChordTarget, NoteTarget } from '@/types/exercise';

export type PitchDetectorStatus =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'listening'
  | 'stopped';

export interface DetectedPitch {
  frequencyHz: number;
  /** Nota más cercana: "E", "C#". */
  noteName: string;
  octave: number;
  /** Desviación respecto al objetivo. Negativo = calado. */
  cents: number;
  /** 0..1 — fiabilidad de la estimación. */
  confidence: number;
  /** Etiqueta lista para pintar: "E2" o "Em". */
  label: string;
}

export interface TargetMatch {
  /** true si la lectura actual cae dentro de `centsTolerance`. */
  inTune: boolean;
  /** ms acumulados sosteniendo el objetivo afinado. */
  heldMs: number;
  /** 0..1 del tiempo de sostenimiento requerido. */
  progress: number;
  /** true cuando se completó `holdMs`. */
  achieved: boolean;
}

export interface UseGuitarPitchDetectorOptions {
  target: NoteTarget | ChordTarget;
  centsTolerance: number;
  holdMs: number;
  /** Arranca y para la escucha; al pasar a false se resetea el progreso. */
  enabled: boolean;
  onAchieved?: () => void;
}

export interface GuitarPitchDetector {
  status: PitchDetectorStatus;
  pitch: DetectedPitch | null;
  match: TargetMatch;
  /** Marca de agua para no olvidar que esto todavía es simulado. */
  isMock: boolean;
  error: string | null;
  restart: () => void;
}

/** Cada cuánto emite una lectura el detector simulado. */
const SAMPLE_INTERVAL_MS = 120;
/** Tiempo "buscando" antes de empezar a acercarse al objetivo. */
const SEARCH_MS = 900;

const IDLE_MATCH: TargetMatch = { inTune: false, heldMs: 0, progress: 0, achieved: false };

function getTargetFrequency(target: NoteTarget | ChordTarget): number {
  if (target.kind === 'note') return target.frequencyHz;
  // Para un acorde se usa la fundamental como referencia de la simulación.
  const root = target.notes[0] ?? 'E';
  return noteToFrequency(root, 3) ?? 164.81;
}

function getTargetLabel(target: NoteTarget | ChordTarget): string {
  return target.kind === 'note' ? formatNote(target.name, target.octave) : target.name;
}

export function useGuitarPitchDetector({
  target,
  centsTolerance,
  holdMs,
  enabled,
  onAchieved,
}: UseGuitarPitchDetectorOptions): GuitarPitchDetector {
  const [status, setStatus] = useState<PitchDetectorStatus>('idle');
  const [pitch, setPitch] = useState<DetectedPitch | null>(null);
  const [match, setMatch] = useState<TargetMatch>(IDLE_MATCH);
  const [attempt, setAttempt] = useState(0);

  const achievedRef = useRef(false);
  const onAchievedRef = useRef(onAchieved);
  onAchievedRef.current = onAchieved;

  const restart = useCallback(() => {
    achievedRef.current = false;
    setPitch(null);
    setMatch(IDLE_MATCH);
    setAttempt((value) => value + 1);
  }, []);

  const targetFrequency = getTargetFrequency(target);
  const targetLabel = getTargetLabel(target);

  useEffect(() => {
    if (!enabled) {
      setStatus('stopped');
      return;
    }

    achievedRef.current = false;
    setMatch(IDLE_MATCH);
    setStatus('listening');

    // TODO(audio): aquí va requestRecordingPermissionsAsync() + apertura del stream.
    const startedAt = Date.now();
    let heldMs = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;

      // Simulación: primero ruido alrededor del objetivo, luego convergencia.
      const convergence = Math.min(1, Math.max(0, (elapsed - SEARCH_MS) / 2200));
      const jitterCents = (Math.random() - 0.5) * 2 * (120 * (1 - convergence) + 6);
      const frequencyHz = targetFrequency * 2 ** (jitterCents / 1200);
      const cents = centsFrom(frequencyHz, targetFrequency);
      const reading = frequencyToNote(frequencyHz);
      const inTune = Math.abs(cents) <= centsTolerance;

      heldMs = inTune ? heldMs + SAMPLE_INTERVAL_MS : Math.max(0, heldMs - SAMPLE_INTERVAL_MS);
      const achieved = heldMs >= holdMs;

      setPitch({
        frequencyHz,
        noteName: reading?.name ?? target.name,
        octave: reading?.octave ?? 0,
        cents: Math.round(cents),
        confidence: Math.min(1, 0.35 + convergence * 0.6),
        label: target.kind === 'chord' && inTune ? targetLabel : formatNote(reading?.name ?? '?', reading?.octave ?? 0),
      });
      setMatch({ inTune, heldMs: Math.min(heldMs, holdMs), progress: Math.min(1, heldMs / holdMs), achieved });

      if (achieved && !achievedRef.current) {
        achievedRef.current = true;
        onAchievedRef.current?.();
      }
    }, SAMPLE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // TODO(audio): cerrar el stream y liberar la sesión de audio.
      setStatus('stopped');
    };
  }, [enabled, attempt, targetFrequency, targetLabel, centsTolerance, holdMs, target.kind, target.name]);

  return { status, pitch, match, isMock: true, error: null, restart };
}
