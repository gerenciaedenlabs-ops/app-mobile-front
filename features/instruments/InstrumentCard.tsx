import { Pressable, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { IconChevronRight } from '@/components/icons';
import type { Instrument } from '@/types/content';
import { useThemeColors } from '@/store/themeStore';

interface InstrumentCardProps {
  instrument: Instrument;
  completedLessons: number;
  totalLessons: number;
  previewAvailable?: boolean;
  /** Último instrumento abierto (preferencia local). */
  isLastOpened?: boolean;
  onPress: () => void;
}

export function InstrumentCard({
  instrument,
  completedLessons,
  totalLessons,
  previewAvailable = false,
  isLastOpened = false,
  onPress,
}: InstrumentCardProps) {
  const colors = useThemeColors();
  const hasContent = totalLessons > 0;
  const progress = hasContent ? completedLessons / totalLessons : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${instrument.name}. ${instrument.tagline}. ${
        hasContent
          ? `${completedLessons} de ${totalLessons} lecciones`
          : previewAvailable
            ? 'Prueba de afinación disponible'
            : 'Próximamente'
      }`}
      onPress={onPress}
      className="w-full flex-row items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4 active:bg-surface-sunken"
    >
      <View
        style={{ backgroundColor: `${instrument.accentColor}1A` }}
        className="h-16 w-16 items-center justify-center rounded-2xl"
      >
        <Text className="text-2xl">{instrument.icon}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-lg font-extrabold text-ink">{instrument.name}</Text>
          <IconChevronRight size={18} color={colors.inkMuted} />
        </View>
        {isLastOpened ? (
          <Text className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wide text-brand-ink">
            Continuar
          </Text>
        ) : null}
        <Text className="mt-0.5 text-xs leading-4 text-ink-muted" numberOfLines={2}>
          {instrument.tagline}
        </Text>

        <View className="mt-3">
        {hasContent ? (
          <>
            <ProgressBar
              value={progress}
              className="h-1.5"
              fillClassName="bg-ink"
              label={`Progreso de ${instrument.name}`}
            />
            <Text className="mt-1.5 text-[11px] font-semibold text-ink-muted">
              {completedLessons}/{totalLessons} lecciones
            </Text>
          </>
        ) : previewAvailable ? (
          <Text className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Prueba disponible
          </Text>
        ) : (
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Próximamente
          </Text>
        )}
        </View>
      </View>
    </Pressable>
  );
}
