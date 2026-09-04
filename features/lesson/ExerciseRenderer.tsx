import type { ExerciseComponentProps } from './exerciseProps';
import { GuitarDetectionExercise } from './exercises/GuitarDetectionExercise';
import { ListenAndChooseExercise } from './exercises/ListenAndChooseExercise';
import { MultipleChoiceExercise } from './exercises/MultipleChoiceExercise';
import { RhythmTapExercise } from './exercises/RhythmTapExercise';

/**
 * Único punto que traduce `exercise.type` a componente.
 *
 * El switch es exhaustivo: al añadir un tipo nuevo a la unión, TypeScript
 * obliga a tratarlo aquí.
 */
export function ExerciseRenderer({ exercise, result, onResult }: ExerciseComponentProps) {
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoiceExercise exercise={exercise} result={result} onResult={onResult} />;
    case 'listen_and_choose':
      return <ListenAndChooseExercise exercise={exercise} result={result} onResult={onResult} />;
    case 'rhythm_tap':
      return <RhythmTapExercise exercise={exercise} result={result} onResult={onResult} />;
    case 'guitar_detection':
      return <GuitarDetectionExercise exercise={exercise} result={result} onResult={onResult} />;
  }
}
