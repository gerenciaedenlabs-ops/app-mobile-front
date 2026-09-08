import { Pressable, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import type { Instrument } from '@/types/content';

interface InstrumentCardProps {
  instrument: Instrument;
  completedLessons: number;
  totalLessons: number;
  previewAvailable?: boolean;
  onPress: () => void;
}

export function InstrumentCard({
  instrument,
  completedLessons,
  totalLessons,
  previewAvailable = false,
  onPress,
}: InstrumentCardProps) {
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
      className="flex-1 rounded-2xl border-2 border-slate-200 bg-white p-4 active:bg-surface-sunken"
    >
      <View
        style={{ backgroundColor: `${instrument.accentColor}1A` }}
        className="h-14 w-14 items-center justify-center rounded-2xl"
      >
        <Text className="text-2xl">{instrument.icon}</Text>
      </View>

      <Text className="mt-3 text-lg font-extrabold text-ink">{instrument.name}</Text>
      <Text className="mt-0.5 text-xs leading-4 text-ink-muted" numberOfLines={2}>
        {instrument.tagline}
      </Text>

      <View className="mt-3">
        {hasContent ? (
          <>
            <ProgressBar
              value={progress}
              className="h-2"
              fillClassName="bg-ink"
              label={`Progreso de ${instrument.name}`}
            />
            <Text className="mt-1.5 text-[11px] font-semibold text-ink-muted">
              {completedLessons}/{totalLessons} lecciones
            </Text>
          </>
        ) : previewAvailable ? (
          <Text className="text-[11px] font-extrabold uppercase tracking-wide text-cyan-700">
            Prueba disponible
          </Text>
        ) : (
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Próximamente
          </Text>
        )}
      </View>
    </Pressable>
  );
}
