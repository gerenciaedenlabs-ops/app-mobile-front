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
    <View className={cn('flex-1 rounded-2xl border border-slate-200 bg-white p-4', className)}>
      <Text className="text-2xl">{icon}</Text>
      <Text className="mt-1 text-2xl font-extrabold text-ink">{value}</Text>
      <Text className="text-xs text-ink-muted">{label}</Text>
    </View>
  );
}
