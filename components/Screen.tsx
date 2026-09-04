import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

interface ScreenProps {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView. */
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: readonly Edge[];
}

export function Screen({
  children,
  scroll = false,
  className,
  contentClassName,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const content = cn('px-5 pb-8 pt-2', contentClassName);

  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-surface-sunken', className)}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1', content)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
