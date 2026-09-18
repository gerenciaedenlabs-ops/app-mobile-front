import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  /** Acepta un icono del set propio o, por compatibilidad, un emoji. */
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center rounded-2xl bg-surface px-6 py-12', className)}>
      {typeof icon === 'string' ? <Text className="text-4xl">{icon}</Text> : icon}
      <Text className="mt-3 text-center text-lg font-bold text-ink">{title}</Text>
      <Text className="mt-1 text-center text-sm text-ink-muted">{description}</Text>
    </View>
  );
}
