import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface HeartsBarProps {
  current: number;
  max: number;
  className?: string;
  /** Muestra solo el contador en vez de un corazón por vida. */
  compact?: boolean;
}

export function HeartsBar({ current, max, className, compact = false }: HeartsBarProps) {
  const label = `${current} de ${max} vidas`;

  if (compact) {
    return (
      <View
        accessibilityLabel={label}
        className={cn('flex-row items-center gap-1 rounded-full bg-danger-soft px-3 py-1.5', className)}
      >
        <Text className="text-base">❤️</Text>
        <Text className="text-sm font-bold text-danger">{current}</Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel={label} className={cn('flex-row items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => (
        <Text key={index} className={cn('text-lg', index >= current && 'opacity-25')}>
          ❤️
        </Text>
      ))}
    </View>
  );
}
