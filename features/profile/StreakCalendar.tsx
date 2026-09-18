import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { IconFlame } from '@/components/icons';
import { cn } from '@/lib/cn';
import { formatMonthLabel, getMonthGrid, todayKey, WEEKDAY_LABELS } from '@/lib/datetime';
import { GAME_COLORS } from '@/lib/theme';
import type { DayKey } from '@/types/progress';

interface StreakCalendarProps {
  practiceDays: readonly DayKey[];
  /** Mes a pintar. Por defecto, el actual. */
  reference?: Date;
}

/**
 * "Calendario Musical" (Diseno Nuevo/perfil): días practicados en dorado con
 * llama y el día de hoy en verde.
 */
export function StreakCalendar({ practiceDays, reference }: StreakCalendarProps) {
  const month = reference ?? new Date();
  const weeks = useMemo(() => getMonthGrid(month), [month]);
  const practiced = useMemo(() => new Set(practiceDays), [practiceDays]);
  const today = todayKey();

  return (
    <View className="gap-3 rounded-2xl border border-line border-b-4 bg-surface p-4">
      <View>
        <Text className="text-base font-bold text-ink">Calendario Musical</Text>
        <Text className="text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
          {formatMonthLabel(month)}
        </Text>
      </View>

      <View className="flex-row border-b border-line pb-1.5">
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} className="flex-1 text-center text-[11px] font-extrabold text-ink-soft">
            {label}
          </Text>
        ))}
      </View>

      <View className="gap-1.5">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((day, dayIndex) => {
              const isPracticed = day !== null && practiced.has(day);
              const isToday = day === today;
              const isFuture = day !== null && day > today;
              const dayNumber = day === null ? '' : String(Number(day.slice(-2)));

              return (
                <View key={dayIndex} className="flex-1 items-center">
                  {day === null ? (
                    <View className="h-9 w-9" />
                  ) : isToday ? (
                    <View
                      accessibilityLabel={`Hoy, ${dayNumber}${isPracticed ? ', practicado' : ''}`}
                      style={{ backgroundColor: GAME_COLORS.green.fill, borderBottomColor: '#1E5000' }}
                      className="h-9 w-9 items-center justify-center rounded-xl border-b-[3px]"
                    >
                      <Text className="text-xs font-extrabold leading-none text-[#1E5000]">{dayNumber}</Text>
                      <Text className="text-[8px] font-extrabold uppercase leading-none text-[#1E5000]">Hoy</Text>
                    </View>
                  ) : isPracticed ? (
                    <View
                      accessibilityLabel={`${dayNumber}, practicado`}
                      className="h-9 w-9 items-center justify-center rounded-xl border border-b-[3px] border-[#FEC700] bg-[#FEC700]/30"
                    >
                      <IconFlame size={10} color={GAME_COLORS.flame.fill} filled />
                      <Text className="text-[11px] font-bold leading-none text-warning">{dayNumber}</Text>
                    </View>
                  ) : (
                    <View className="h-9 w-9 items-center justify-center">
                      <Text className={cn('text-xs font-medium text-ink-soft', isFuture ? 'opacity-30' : 'opacity-40')}>
                        {dayNumber}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-center gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-[#FEC700]" />
          <Text className="text-[11px] font-medium text-ink-soft">Completado</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-[#58CC02]" />
          <Text className="text-[11px] font-medium text-ink-soft">Práctica de hoy</Text>
        </View>
      </View>
    </View>
  );
}
