import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useMetronome } from '@/hooks/useMetronome';
import { useMetronomeClicks } from '@/hooks/useMetronomeClicks';
import { cn } from '@/lib/cn';
import { evaluateRhythm, type RhythmEvaluation } from '@/lib/scoring';
import type { RhythmTapExercise as RhythmTapExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';

export function RhythmTapExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<RhythmTapExerciseData>) {
  const [evaluation, setEvaluation] = useState<RhythmEvaluation | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapsRef = useRef<number[]>([]);

  const lastBeat = exercise.pattern.reduce((max, beat) => Math.max(max, beat), 0);
  const revealed = result !== null;

  const handleComplete = useCallback(() => {
    const outcome = evaluateRhythm(exercise, tapsRef.current);
    setEvaluation(outcome);
    onResult({
      exerciseId: exercise.id,
      correct: outcome.passed,
      score: outcome.accuracy,
    });
  }, [exercise, onResult]);

  const metronome = useMetronome({
    bpm: exercise.bpm,
    countInBeats: exercise.countInBeats,
    totalBeats: lastBeat + 1,
    tailMs: exercise.toleranceMs,
    onComplete: handleComplete,
  });

  // Clic audible en cada pulso, incluida la cuenta de entrada.
  const playClick = useMetronomeClicks();
  const beatsPerBar = exercise.timeSignature[0];
  useEffect(() => {
    if (!metronome.isRunning) return;
    const positionInBar = ((metronome.beat % beatsPerBar) + beatsPerBar) % beatsPerBar;
    playClick(positionInBar === 0);
  }, [metronome.beat, metronome.isRunning, beatsPerBar, playClick]);

  const start = () => {
    tapsRef.current = [];
    setTapCount(0);
    setEvaluation(null);
    metronome.start();
  };

  const handleTap = () => {
    if (!metronome.isRunning) return;
    const elapsed = metronome.getPatternElapsedMs();
    // Durante la cuenta de entrada los toques se ignoran en vez de penalizar.
    if (elapsed === null || elapsed < -exercise.toleranceMs) return;
    tapsRef.current = [...tapsRef.current, elapsed];
    setTapCount(tapsRef.current.length);
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-extrabold leading-8 text-ink">{exercise.prompt}</Text>
      <Text className="mt-2 text-sm text-ink-muted">
        {exercise.bpm} BPM · {exercise.timeSignature[0]}/{exercise.timeSignature[1]}
        {exercise.hint ? ` · ${exercise.hint}` : ''}
      </Text>

      {/* Mapa del patrón: un punto por golpe objetivo. */}
      <View className="mt-6 flex-row flex-wrap gap-2">
        {exercise.pattern.map((beat, index) => {
          const match = evaluation?.matches[index];
          const isCurrent = metronome.isRunning && !metronome.isCountingIn && Math.floor(beat) === metronome.beat;

          return (
            <View
              key={beat}
              className={cn(
                'h-10 flex-1 min-w-[36px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white',
                isCurrent && 'border-brand bg-brand-soft',
                match && match.score >= 0.6 && 'border-success bg-success-soft',
                match && match.score > 0 && match.score < 0.6 && 'border-warning bg-warning-soft',
                match && match.score === 0 && 'border-danger bg-danger-soft',
              )}
            >
              <Text className="text-xs font-bold text-ink-soft">
                {Number.isInteger(beat) ? beat + 1 : 'y'}
              </Text>
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zona de toque rítmico"
        accessibilityHint="Toca siguiendo el pulso"
        onPressIn={handleTap}
        disabled={!metronome.isRunning}
        className={cn(
          'mt-6 flex-1 items-center justify-center rounded-3xl border-4 border-dashed border-slate-300 bg-white',
          metronome.isRunning && 'border-solid border-brand bg-brand-soft',
          !metronome.isRunning && 'opacity-70',
        )}
      >
        {metronome.isCountingIn && metronome.isRunning ? (
          <>
            <Text className="text-6xl font-extrabold text-brand">
              {exercise.countInBeats + metronome.beat + 1}
            </Text>
            <Text className="mt-2 text-sm text-ink-muted">Preparando…</Text>
          </>
        ) : metronome.isRunning ? (
          <>
            <Text className="text-6xl">👆</Text>
            <Text className="mt-2 text-sm font-semibold text-brand">
              Pulso {metronome.beat + 1} · {tapCount} toques
            </Text>
          </>
        ) : evaluation ? (
          <>
            <Text className="text-5xl font-extrabold text-ink">
              {Math.round(evaluation.accuracy * 100)}%
            </Text>
            <Text className="mt-2 text-sm text-ink-muted">
              {evaluation.matches.filter((match) => match.score > 0).length} de {exercise.pattern.length} golpes
              {evaluation.extraTaps > 0 ? ` · ${evaluation.extraTaps} de más` : ''}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-5xl">🥁</Text>
            <Text className="mt-2 px-6 text-center text-sm text-ink-muted">
              Escucha la cuenta de entrada y toca aquí en cada golpe.
            </Text>
          </>
        )}
      </Pressable>

      {!revealed && !metronome.isRunning ? (
        <Button
          label={evaluation ? 'Reintentar' : 'Empezar'}
          onPress={start}
          className="mt-4"
          icon="▶️"
        />
      ) : null}
    </View>
  );
}
