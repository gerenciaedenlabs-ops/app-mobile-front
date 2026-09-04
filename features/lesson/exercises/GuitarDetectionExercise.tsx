import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { useGuitarPitchDetector } from '@/hooks/useGuitarPitchDetector';
import { cn } from '@/lib/cn';
import { formatNote } from '@/lib/pitch';
import type { ChordTarget, GuitarDetectionExercise as GuitarDetectionExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';

/** Diagrama de acorde en horizontal: 6ª cuerda arriba. */
function ChordDiagram({ target }: { target: ChordTarget }) {
  return (
    <View className="gap-1.5">
      {target.diagram.map((position, index) => (
        <View key={index} className="flex-row items-center gap-3">
          <Text className="w-10 text-xs font-semibold text-ink-muted">{6 - index}ª</Text>
          <View className="h-0.5 flex-1 bg-slate-300" />
          <View
            className={cn(
              'h-7 w-7 items-center justify-center rounded-full',
              position === 'x' ? 'bg-slate-200' : position === 0 ? 'bg-white border-2 border-ink' : 'bg-ink',
            )}
          >
            <Text
              className={cn(
                'text-xs font-bold',
                position === 'x' ? 'text-ink-muted' : position === 0 ? 'text-ink' : 'text-white',
              )}
            >
              {position === 'x' ? '✕' : position === 0 ? '○' : position}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function GuitarDetectionExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<GuitarDetectionExerciseData>) {
  const [listening, setListening] = useState(false);
  const revealed = result !== null;

  const handleAchieved = useCallback(() => {
    setListening(false);
    onResult({ exerciseId: exercise.id, correct: true, score: 1 });
  }, [exercise.id, onResult]);

  const detector = useGuitarPitchDetector({
    target: exercise.target,
    centsTolerance: exercise.centsTolerance,
    holdMs: exercise.holdMs,
    enabled: listening,
    onAchieved: handleAchieved,
  });

  // Si se agota el tiempo, el ejercicio se da por fallado y se libera el micro.
  useEffect(() => {
    if (!listening) return;
    const timeout = setTimeout(() => {
      setListening(false);
      onResult({ exerciseId: exercise.id, correct: false, score: 0 });
    }, exercise.timeoutMs);
    return () => clearTimeout(timeout);
  }, [listening, exercise.id, exercise.timeoutMs, onResult]);

  const targetLabel =
    exercise.target.kind === 'note'
      ? formatNote(exercise.target.name, exercise.target.octave)
      : exercise.target.name;

  const cents = detector.pitch?.cents ?? 0;
  // La aguja se mueve dentro de ±50 cents; fuera de ahí se queda en el extremo.
  const needleOffset = Math.max(-1, Math.min(1, cents / 50));

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2 self-start rounded-full bg-warning-soft px-3 py-1">
        <Text className="text-xs">🧪</Text>
        <Text className="text-xs font-bold text-warning">Detección simulada</Text>
      </View>

      <Text className="mt-4 text-2xl font-extrabold leading-8 text-ink">{exercise.prompt}</Text>
      {exercise.hint ? <Text className="mt-2 text-sm text-ink-muted">{exercise.hint}</Text> : null}

      <View className="mt-6 items-center rounded-2xl border border-slate-200 bg-white p-5">
        <Text className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Objetivo</Text>
        <Text className="mt-1 text-5xl font-extrabold text-ink">{targetLabel}</Text>

        {exercise.target.kind === 'note' && exercise.target.string !== undefined ? (
          <Text className="mt-1 text-sm text-ink-muted">
            {exercise.target.string}ª cuerda
            {exercise.target.fret === 0 ? ' al aire' : ` · traste ${exercise.target.fret ?? '?'}`}
          </Text>
        ) : null}

        {exercise.target.kind === 'chord' ? (
          <View className="mt-4 w-full">
            <ChordDiagram target={exercise.target} />
          </View>
        ) : null}
      </View>

      <View className="mt-6 flex-1 justify-center">
        {listening ? (
          <>
            {/* Afinador: la marca central es la nota afinada. */}
            <View className="h-16 justify-center rounded-2xl border border-slate-200 bg-white px-4">
              <View className="h-1 w-full rounded-full bg-slate-200" />
              <View className="absolute left-1/2 h-10 w-0.5 bg-slate-300" />
              <View
                style={{ left: `${50 + needleOffset * 45}%` }}
                className={cn(
                  'absolute h-10 w-1.5 rounded-full',
                  detector.match.inTune ? 'bg-success' : 'bg-danger',
                )}
              />
            </View>

            <View className="mt-4 items-center">
              <Text
                className={cn(
                  'text-4xl font-extrabold',
                  detector.match.inTune ? 'text-success' : 'text-ink',
                )}
              >
                {detector.pitch?.label ?? '—'}
              </Text>
              <Text className="mt-1 text-sm text-ink-muted">
                {detector.pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : 'Escuchando…'}
              </Text>
            </View>

            <View className="mt-6">
              <ProgressBar
                value={detector.match.progress}
                label="Tiempo sosteniendo la nota"
                fillClassName="bg-brand"
              />
              <Text className="mt-2 text-center text-xs text-ink-muted">
                Mantén el sonido {Math.round(exercise.holdMs / 100) / 10} s
              </Text>
            </View>
          </>
        ) : (
          <View className="items-center">
            <Text className="text-5xl">{revealed ? (result?.correct ? '🎸' : '😕') : '🎧'}</Text>
            <Text className="mt-3 px-6 text-center text-sm text-ink-muted">
              {revealed
                ? result?.correct
                  ? '¡Sonó limpio!'
                  : 'Se acabó el tiempo. Puedes repasarlo más adelante.'
                : 'Coge la guitarra, sube el volumen del ambiente al mínimo y dale a Escuchar.'}
            </Text>
          </View>
        )}
      </View>

      {!revealed && !listening ? (
        <Button label="Escuchar" icon="🎤" onPress={() => setListening(true)} className="mt-4" />
      ) : null}
      {listening ? (
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={() => setListening(false)}
          className="mt-4"
        />
      ) : null}
    </View>
  );
}
