import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface TactileButtonProps {
  label: string;
  onPress: () => void;
  /** Relleno del botón. */
  color: string;
  /** Borde 3D inferior, un tono más oscuro que `color`. */
  lipColor: string;
  textColor?: string;
  icon?: ReactNode;
  /** Alto sin contar el labio. */
  height?: number;
  radius?: number;
  /** Grosor del labio en reposo. */
  lip?: number;
  disabled?: boolean;
  uppercase?: boolean;
  textClassName?: string;
  className?: string;
  accessibilityHint?: string;
}

/**
 * Botón con relieve estilo Duolingo: el labio inferior simula una tecla física
 * y al pulsar el botón "baja" hasta casi tocarlo.
 */
export function TactileButton({
  label,
  onPress,
  color,
  lipColor,
  textColor = '#FFFFFF',
  icon,
  height = 48,
  radius = 16,
  lip = 4,
  disabled = false,
  uppercase = true,
  textClassName,
  className,
  accessibilityHint,
}: TactileButtonProps) {
  return (
    <View className={cn(disabled && 'opacity-50', className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: radius,
          backgroundColor: lipColor,
          // Al pulsar, el cuerpo baja y el labio visible pasa a 1 px.
          paddingBottom: pressed ? 1 : lip,
          marginTop: pressed ? lip - 1 : 0,
        })}
      >
        <View
          style={{ height, borderRadius: radius, backgroundColor: color }}
          className="flex-row items-center justify-center gap-2 px-4"
        >
          {icon}
          <Text
            numberOfLines={1}
            style={{ color: textColor }}
            className={cn(
              'text-[15px] font-extrabold',
              uppercase && 'uppercase tracking-wider',
              textClassName,
            )}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
