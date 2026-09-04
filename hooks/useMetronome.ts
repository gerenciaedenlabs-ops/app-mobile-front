/**
 * Reloj de pulsos para los ejercicios de ritmo.
 *
 * El tiempo se mide siempre contra `Date.now()` guardado al arrancar; el
 * requestAnimationFrame solo sirve para refrescar la UI. Contar frames
 * acumularía error y la precisión del ejercicio depende de esto.
 *
 * Para evitar 60 renders por segundo, el estado solo cambia cuando cambia el
 * número de pulso.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseMetronomeOptions {
  bpm: number;
  /** Pulsos de preparación antes del beat 0 del patrón. */
  countInBeats: number;
  /** Pulsos del patrón; al terminarlos se dispara `onComplete`. */
  totalBeats: number;
  /** Margen extra tras el último pulso para aceptar toques tardíos. */
  tailMs?: number;
  onComplete?: () => void;
}

export interface Metronome {
  isRunning: boolean;
  /**
   * Pulso actual. Negativo durante la cuenta de entrada
   * (-countInBeats … -1), 0 en el primer pulso del patrón.
   */
  beat: number;
  isCountingIn: boolean;
  start: () => void;
  stop: () => void;
  /** ms transcurridos desde el beat 0 del patrón, o null si no está corriendo. */
  getPatternElapsedMs: () => number | null;
}

export function useMetronome({
  bpm,
  countInBeats,
  totalBeats,
  tailMs = 0,
  onComplete,
}: UseMetronomeOptions): Metronome {
  const [isRunning, setIsRunning] = useState(false);
  const [beat, setBeat] = useState(-countInBeats);

  const startedAtRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const msPerBeat = 60000 / bpm;
  const countInMs = countInBeats * msPerBeat;
  const durationMs = countInMs + totalBeats * msPerBeat + tailMs;

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    startedAtRef.current = null;
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const startedAt = Date.now();
    startedAtRef.current = startedAt;
    setIsRunning(true);
    setBeat(-countInBeats);

    let lastBeat = -countInBeats - 1;

    const tick = () => {
      const elapsed = Date.now() - startedAt;

      if (elapsed >= durationMs) {
        frameRef.current = null;
        startedAtRef.current = null;
        setIsRunning(false);
        onCompleteRef.current?.();
        return;
      }

      const currentBeat = Math.floor(elapsed / msPerBeat) - countInBeats;
      if (currentBeat !== lastBeat) {
        lastBeat = currentBeat;
        setBeat(currentBeat);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [countInBeats, durationMs, msPerBeat]);

  const getPatternElapsedMs = useCallback(() => {
    if (startedAtRef.current === null) return null;
    return Date.now() - startedAtRef.current - countInMs;
  }, [countInMs]);

  // Cleanup: sin esto el rAF sigue vivo si se sale de la pantalla a media cuenta.
  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  return {
    isRunning,
    beat,
    isCountingIn: beat < 0,
    start,
    stop,
    getPatternElapsedMs,
  };
}
