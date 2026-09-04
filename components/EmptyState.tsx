import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center rounded-2xl bg-white/60 px-6 py-12', className)}>
      <Text className="text-4xl">{icon}</Text>
      <Text className="mt-3 text-center text-lg font-bold text-ink">{title}</Text>
      <Text className="mt-1 text-center text-sm text-ink-muted">{description}</Text>
    </View>
  );
}
