import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';

interface FeedbackFooterProps {
  correct: boolean;
  explanation?: string | undefined;
  /** Texto del botón: cambia en el último ejercicio. */
  actionLabel: string;
  onContinue: () => void;
}

export function FeedbackFooter({ correct, explanation, actionLabel, onContinue }: FeedbackFooterProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className={cn('-mx-5 -mb-8 gap-3 border-t px-5 pb-8 pt-4', correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft')}
    >
      <View className="flex-row items-center gap-2">
        <View className={cn('h-10 w-10 items-center justify-center rounded-full bg-white')}>
          <Text className="text-xl">{correct ? '✓' : '✕'}</Text>
        </View>
        <Text className={cn('text-lg font-extrabold', correct ? 'text-success' : 'text-danger')}>
          {correct ? '¡Correcto!' : 'No era esa'}
        </Text>
      </View>

      {explanation ? (
        <Text className={cn('text-sm', correct ? 'text-success' : 'text-danger')}>{explanation}</Text>
      ) : null}

      <Button label={actionLabel} variant={correct ? 'success' : 'danger'} onPress={onContinue} />
    </View>
  );
}
