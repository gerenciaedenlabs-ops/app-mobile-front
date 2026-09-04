import { Pressable, Text, View } from 'react-native';

import { HeartsBar } from '@/components/HeartsBar';
import { ProgressBar } from '@/components/ProgressBar';

interface LessonTopBarProps {
  /** 0..1 */
  progress: number;
  hearts: number;
  maxHearts: number;
  onExit: () => void;
}

export function LessonTopBar({ progress, hearts, maxHearts, onExit }: LessonTopBarProps) {
  return (
    <View className="flex-row items-center gap-3 pb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Salir de la lección"
        onPress={onExit}
        hitSlop={12}
        className="h-9 w-9 items-center justify-center rounded-full active:bg-slate-200"
      >
        <Text className="text-xl text-ink-muted">✕</Text>
      </Pressable>

      <ProgressBar value={progress} label="Progreso de la lección" className="flex-1" />
      <HeartsBar current={hearts} max={maxHearts} compact />
    </View>
  );
}
