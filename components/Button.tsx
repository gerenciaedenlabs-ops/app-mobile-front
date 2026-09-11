import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Emoji o carácter que se pinta antes del texto. */
  icon?: string;
  className?: string;
  accessibilityHint?: string;
}

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-brand active:bg-brand-strong',
  secondary: 'bg-white border-2 border-slate-200 active:bg-surface-sunken',
  success: 'bg-success active:opacity-90',
  danger: 'bg-danger active:opacity-90',
  ghost: 'bg-transparent active:bg-surface-sunken',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  success: 'text-white',
  danger: 'text-white',
  ghost: 'text-ink-muted',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  icon,
  className,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'items-center justify-center rounded-2xl border-b-4',
        size === 'lg' ? 'min-h-[56px] px-6 py-4' : 'min-h-[44px] px-4 py-2.5',
        CONTAINER[variant],
        variant === 'primary' && 'border-brand-strong',
        variant === 'secondary' && 'border-slate-300',
        variant === 'success' && 'border-green-700',
        variant === 'danger' && 'border-red-700',
        variant === 'ghost' && 'border-transparent',
        disabled && 'opacity-40',
        className,
      )}
    >
      <View className="flex-row items-center gap-2">
        {icon ? <Text className="text-lg">{icon}</Text> : null}
        <Text
          className={cn(
            'text-center font-bold tracking-wide',
            size === 'lg' ? 'text-base' : 'text-sm',
            LABEL[variant],
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
