import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import type { UnsupportedExercise as UnsupportedExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';

/**
 * Placeholder para tipos del backend sin `data` documentada (ritmo_toque,
 * deteccion_guitarra, emparejar, banco_palabras, dictado). No bloquea la
 * sesión: deja saltar el ejercicio con un resultado neutral.
 */
export function UnsupportedExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<UnsupportedExerciseData>) {
  return (
    <View className="flex-1 justify-center">
      <EmptyState
        icon="🚧"
        title="Tipo de ejercicio no soportado todavía"
        description={`"${exercise.typeName}" llegará en una futura actualización.`}
      />

      {result === null ? (
        <Button
          label="Saltar este ejercicio"
          variant="secondary"
          onPress={() => onResult({ exerciseId: exercise.id, correct: true, score: 1 })}
          className="mt-4"
        />
      ) : null}
    </View>
  );
}
