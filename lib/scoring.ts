/**
 * Puntuación de ejercicios y XP de la lección.
 */
import type { Lesson } from '@/types/content';
import type { ExerciseResult, RhythmTapExercise } from '@/types/exercise';

export interface TapMatch {
  /** Beat objetivo, en negras desde el inicio del patrón. */
  targetBeat: number;
  /** Desviación en ms respecto al beat. Negativo = se adelantó. null = no tocó. */
  offsetMs: number | null;
  /** 0..1 — 1 es clavado, 0 es fuera de la ventana de tolerancia. */
  score: number;
}

export interface RhythmEvaluation {
  matches: TapMatch[];
  /** Toques que no correspondían a ningún objetivo. */
  extraTaps: number;
  /** 0..1 ya con la penalización aplicada. */
  accuracy: number;
  passed: boolean;
}

/**
 * Empareja cada beat objetivo con el toque más cercano dentro de la ventana.
 *
 * @param tapTimesMs momentos de los toques, en ms desde el inicio del patrón
 *                   (ya descontada la cuenta de entrada).
 */
export function evaluateRhythm(exercise: RhythmTapExercise, tapTimesMs: readonly number[]): RhythmEvaluation {
  const msPerBeat = 60000 / exercise.bpm;
  const available = tapTimesMs.map((time) => ({ time, used: false }));

  const matches = exercise.pattern.map<TapMatch>((targetBeat) => {
    const targetMs = targetBeat * msPerBeat;

    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    available.forEach((tap, index) => {
      if (tap.used) return;
      const distance = Math.abs(tap.time - targetMs);
      if (distance < bestDistance && distance <= exercise.toleranceMs) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const best = bestIndex >= 0 ? available[bestIndex] : undefined;
    if (!best) return { targetBeat, offsetMs: null, score: 0 };

    best.used = true;
    // Puntuación lineal: clavado = 1, en el borde de la ventana = 0.
    return {
      targetBeat,
      offsetMs: best.time - targetMs,
      score: 1 - bestDistance / exercise.toleranceMs,
    };
  });

  const extraTaps = available.filter((tap) => !tap.used).length;
  const rawAccuracy = matches.reduce((total, match) => total + match.score, 0) / matches.length;
  // Los toques de más restan, con tope: teclear la pantalla no puede aprobar.
  const penalty = Math.min(0.4, extraTaps * 0.12);
  const accuracy = Math.max(0, Math.min(1, rawAccuracy - penalty));

  return { matches, extraTaps, accuracy, passed: accuracy >= exercise.passAccuracy };
}

/** Media de las puntuaciones de los ejercicios de la sesión. */
export function computeLessonScore(results: readonly ExerciseResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((total, result) => total + result.score, 0) / results.length;
}

export const PERFECT_LESSON_BONUS_XP = 5;

/**
 * XP: el 60 % de la recompensa es por terminar y el 40 % depende de lo bien
 * que se haya hecho. Sin fallos hay bonus.
 */
export function computeXpEarned(lesson: Lesson, results: readonly ExerciseResult[]): number {
  const score = computeLessonScore(results);
  const base = Math.round(lesson.xpReward * (0.6 + 0.4 * score));
  const flawless = results.length > 0 && results.every((result) => result.correct);
  return base + (flawless ? PERFECT_LESSON_BONUS_XP : 0);
}
