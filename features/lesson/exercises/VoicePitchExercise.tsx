import { VoicePitchChallenge } from '@/features/voice/VoicePitchChallenge';
import type { VoicePitchExercise as VoicePitchExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';

const NOTE_NAMES_ES: Record<string, string> = {
  C: 'DO',
  'C#': 'DO♯',
  D: 'RE',
  'D#': 'RE♯',
  E: 'MI',
  F: 'FA',
  'F#': 'FA♯',
  G: 'SOL',
  'G#': 'SOL♯',
  A: 'LA',
  'A#': 'LA♯',
  B: 'SI',
};

export function VoicePitchExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<VoicePitchExerciseData>) {
  return (
    <VoicePitchChallenge
      target={exercise.target}
      displayName={NOTE_NAMES_ES[exercise.target.name] ?? exercise.target.name}
      prompt={exercise.prompt}
      hint={exercise.hint}
      centsTolerance={exercise.centsTolerance}
      evaluationDurationMs={exercise.evaluationDurationMs}
      timeoutMs={exercise.timeoutMs}
      onResult={({ correct }) => {
        if (result === null) onResult({ exerciseId: exercise.id, correct, score: correct ? 1 : 0 });
      }}
    />
  );
}
