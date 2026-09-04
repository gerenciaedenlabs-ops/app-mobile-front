import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import type { Choice } from '@/types/exercise';

interface ChoiceListProps {
  choices: readonly Choice[];
  selectedId: string | null;
  correctChoiceId: string;
  /** true cuando ya se comprobó: pinta correcta/incorrecta y bloquea. */
  revealed: boolean;
  onSelect: (choiceId: string) => void;
}

/** Lista de opciones compartida por multiple_choice y listen_and_choose. */
export function ChoiceList({ choices, selectedId, correctChoiceId, revealed, onSelect }: ChoiceListProps) {
  return (
    <View className="gap-3">
      {choices.map((choice) => {
        const isSelected = choice.id === selectedId;
        const isCorrect = choice.id === correctChoiceId;
        const showAsCorrect = revealed && isCorrect;
        const showAsWrong = revealed && isSelected && !isCorrect;

        return (
          <Pressable
            key={choice.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: revealed }}
            accessibilityLabel={choice.sublabel ? `${choice.label}, ${choice.sublabel}` : choice.label}
            disabled={revealed}
            onPress={() => onSelect(choice.id)}
            className={cn(
              'min-h-[60px] justify-center rounded-2xl border-2 bg-white px-4 py-3',
              !revealed && isSelected && 'border-brand bg-brand-soft',
              !revealed && !isSelected && 'border-slate-200 active:bg-surface-sunken',
              showAsCorrect && 'border-success bg-success-soft',
              showAsWrong && 'border-danger bg-danger-soft',
              revealed && !showAsCorrect && !showAsWrong && 'border-slate-200 opacity-60',
            )}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text
                  className={cn(
                    'text-base font-semibold text-ink',
                    showAsCorrect && 'text-success',
                    showAsWrong && 'text-danger',
                  )}
                >
                  {choice.label}
                </Text>
                {choice.sublabel ? (
                  <Text className="mt-0.5 text-xs text-ink-muted">{choice.sublabel}</Text>
                ) : null}
              </View>
              {showAsCorrect ? <Text className="text-lg">✅</Text> : null}
              {showAsWrong ? <Text className="text-lg">❌</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
