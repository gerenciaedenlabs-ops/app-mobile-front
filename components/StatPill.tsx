import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface StatPillProps {
  /** Acepta un icono del set propio o, por compatibilidad, un emoji. */
  icon: ReactNode;
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
      className={cn('flex-row items-center gap-1.5 rounded-full bg-surface px-3 py-1.5', className)}
    >
      {typeof icon === 'string' ? <Text className="text-base">{icon}</Text> : icon}
      <Text className={cn('text-sm font-bold text-ink', textClassName)}>{value}</Text>
    </View>
  );
}
