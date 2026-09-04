import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/cn';
import { getAudioClip } from '@/lib/audio';
import type { ListenAndChooseExercise as ListenAndChooseExerciseData } from '@/types/exercise';

import type { ExerciseComponentProps } from '../exerciseProps';
import { ChoiceList } from './ChoiceList';

export function ListenAndChooseExercise({
  exercise,
  result,
  onResult,
}: ExerciseComponentProps<ListenAndChooseExerciseData>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replays, setReplays] = useState(0);
  const autoPlayedRef = useRef(false);

  const source = getAudioClip(exercise.audioKey);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const revealed = result !== null;
  const replaysLeft = exercise.maxReplays === null ? null : exercise.maxReplays - replays;
  const canReplay = replaysLeft === null || replaysLeft > 0;

  const play = () => {
    // seekTo(0) para que un segundo toque reinicie el clip en vez de ignorarse.
    void player.seekTo(0).then(() => player.play());
  };

  // Reproducción automática en cuanto el clip está cargado, una sola vez.
  useEffect(() => {
    if (!exercise.autoPlay || autoPlayedRef.current || !status.isLoaded || source === null) return;
    autoPlayedRef.current = true;
    player.play();
  }, [exercise.autoPlay, player, source, status.isLoaded]);

  if (source === null) {
    return (
      <EmptyState
        icon="🔇"
        title="Audio no disponible"
        description={`Falta el clip "${exercise.audioKey}" en lib/audio.ts.`}
        className="flex-1"
      />
    );
  }

  const check = () => {
    if (selectedId === null) return;
    const correct = selectedId === exercise.correctChoiceId;
    onResult({ exerciseId: exercise.id, correct, score: correct ? 1 : 0 });
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-extrabold leading-8 text-ink">{exercise.prompt}</Text>

      <View className="my-6 items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? 'Sonando' : 'Reproducir el audio'}
          accessibilityState={{ disabled: !canReplay }}
          disabled={!canReplay}
          onPress={() => {
            play();
            setReplays((value) => value + 1);
          }}
          className={cn(
            'h-28 w-28 items-center justify-center rounded-full bg-brand active:bg-brand-strong',
            status.playing && 'bg-brand-strong',
            !canReplay && 'opacity-40',
          )}
        >
          <Text className="text-4xl">{status.playing ? '🔊' : '▶️'}</Text>
        </Pressable>

        <Text className="mt-3 text-xs text-ink-muted">
          {replaysLeft === null
            ? 'Puedes repetirlo las veces que quieras'
            : replaysLeft > 0
              ? `${replaysLeft} repetición${replaysLeft === 1 ? '' : 'es'} disponible${replaysLeft === 1 ? '' : 's'}`
              : 'Sin repeticiones'}
        </Text>
      </View>

      <View className="flex-1">
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
