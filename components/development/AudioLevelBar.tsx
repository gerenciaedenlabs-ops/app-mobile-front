import { Text, View } from 'react-native';

interface AudioLevelBarProps {
  level: number;
}

export function AudioLevelBar({ level }: AudioLevelBarProps) {
  const percent = Math.round(Math.max(0, Math.min(1, level)) * 100);
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Entrada</Text>
        <Text className="text-xs font-bold text-ink-muted">{percent}%</Text>
      </View>
      <View className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
        <View className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}

