import { Pressable, Text, View } from 'react-native';

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
    <View className="flex-row items-center gap-3 px-4 py-2.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Salir de la lección"
        onPress={onExit}
        hitSlop={12}
        className="items-center justify-center"
      >
        <Text className="text-2xl text-ink-muted">✕</Text>
      </Pressable>

      <ProgressBar value={progress} label="Progreso de la lección" className="flex-1" />
      
      <View className="flex-row items-center gap-1">
        <Text className="text-lg">❤️</Text>
        <Text className="text-sm font-bold text-ink">{hearts}</Text>
      </View>
    </View>
  );
}
