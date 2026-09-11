import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface StatTileProps {
  icon: string;
  value: string | number;
  label: string;
  className?: string;
}

export function StatTile({ icon, value, label, className }: StatTileProps) {
  return (
    <View className={cn('flex-1 items-center rounded-2xl border border-slate-200 bg-white px-2 py-4', className)}>
      <Text className="text-xl">{icon}</Text>
      <Text className="mt-1 text-xl font-extrabold text-ink">{value}</Text>
      <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-ink-muted">{label}</Text>
    </View>
  );
}
