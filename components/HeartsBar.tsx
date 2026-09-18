import { Text, View } from 'react-native';

import { IconHeart } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/store/themeStore';

interface HeartsBarProps {
  current: number;
  max: number;
  className?: string;
  /** Muestra solo el contador en vez de un corazón por vida. */
  compact?: boolean;
}


export function HeartsBar({ current, max, className, compact = false }: HeartsBarProps) {
  const colors = useThemeColors();
  const label = `${current} de ${max} vidas`;

  if (compact) {
    return (
      <View
        accessibilityLabel={label}
        className={cn('flex-row items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5', className)}
      >
        <IconHeart size={16} color={colors.danger} filled />
        <Text className="text-sm font-bold text-danger">{current}</Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel={label} className={cn('flex-row items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => (
        <View key={index} className={cn(index >= current && 'opacity-25')}>
          <IconHeart size={20} color={colors.danger} filled={index < current} />
        </View>
      ))}
    </View>
  );
}
