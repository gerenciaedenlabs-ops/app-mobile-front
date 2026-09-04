import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface StatPillProps {
  icon: string;
  value: string | number;
  label?: string;
  className?: string;
  textClassName?: string;
}

/** Píldora compacta para XP, racha y similares en las barras superiores. */
export function StatPill({ icon, value, label, className, textClassName }: StatPillProps) {
  return (
    <View
      accessibilityLabel={label ? `${label}: ${value}` : String(value)}
      className={cn('flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5', className)}
    >
      <Text className="text-base">{icon}</Text>
      <Text className={cn('text-sm font-bold text-ink', textClassName)}>{value}</Text>
    </View>
  );
}
