import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface StatTileProps {
  /** Acepta un icono del set propio o, por compatibilidad, un emoji. */
  icon: ReactNode;
  value: string | number;
  label: string;
  className?: string;
}

export function StatTile({ icon, value, label, className }: StatTileProps) {
  return (
    <View className={cn('flex-1 items-center rounded-2xl border border-line bg-surface px-2 py-4', className)}>
      {typeof icon === 'string' ? <Text className="text-xl">{icon}</Text> : icon}
      <Text className="mt-1 text-xl font-extrabold text-ink">{value}</Text>
      <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-ink-muted">{label}</Text>
    </View>
  );
}
