import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import type { MultipleChoiceExercise as MultipleChoiceExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';
import { ChoiceList } from './ChoiceList';

export function MultipleChoiceExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<MultipleChoiceExerciseData>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const revealed = result !== null;

  const check = () => {
    if (selectedId === null) return;
    const correct = selectedId === exercise.correctChoiceId;
    onResult({ exerciseId: exercise.id, correct, score: correct ? 1 : 0 });
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-extrabold leading-8 text-ink">{exercise.prompt}</Text>
      {exercise.hint ? <Text className="mt-2 text-sm text-ink-muted">{exercise.hint}</Text> : null}

      <View className="mt-6 flex-1">
        <ChoiceList
          choices={exercise.choices}
          selectedId={selectedId}
          correctChoiceId={exercise.correctChoiceId}
          revealed={revealed}
          onSelect={setSelectedId}
        />
      </View>

      {!revealed ? (
        <Button label="Comprobar" onPress={check} disabled={selectedId === null} className="mt-4" />
      ) : null}
    </View>
  );
}
