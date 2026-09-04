import { View } from 'react-native';

import { cn } from '@/lib/cn';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  className?: string;
  fillClassName?: string;
  label?: string;
}

export function ProgressBar({ value, className, fillClassName, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Progreso'}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className={cn('h-3 w-full overflow-hidden rounded-full bg-slate-200', className)}
    >
      <View
        style={{ width: `${percent}%` }}
        className={cn('h-full rounded-full bg-success', fillClassName)}
      />
    </View>
  );
}
