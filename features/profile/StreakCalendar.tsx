import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatMonthLabel, getMonthGrid, todayKey, WEEKDAY_LABELS } from '@/lib/datetime';
import type { DayKey } from '@/types/progress';

interface StreakCalendarProps {
  practiceDays: readonly DayKey[];
  /** Mes a pintar. Por defecto, el actual. */
  reference?: Date;
}

/** Calendario simple del mes: marca los días con al menos una lección. */
export function StreakCalendar({ practiceDays, reference }: StreakCalendarProps) {
  const month = reference ?? new Date();
  const weeks = useMemo(() => getMonthGrid(month), [month]);
  const practiced = useMemo(() => new Set(practiceDays), [practiceDays]);
  const today = todayKey();

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <Text className="text-sm font-bold capitalize text-ink">{formatMonthLabel(month)}</Text>

      <View className="mt-3 flex-row">
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} className="flex-1 text-center text-[11px] font-bold text-ink-muted">
            {label}
          </Text>
        ))}
      </View>

      <View className="mt-1 gap-1">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((day, dayIndex) => {
              const isPracticed = day !== null && practiced.has(day);
              const isToday = day === today;

              return (
                <View key={dayIndex} className="flex-1 items-center py-1">
                  <View
                    accessibilityLabel={
                      day === null ? undefined : `${day}${isPracticed ? ', practicado' : ''}`
                    }
                    className={cn(
                      'h-8 w-8 items-center justify-center rounded-full',
                      isPracticed && 'bg-streak',
                      isToday && !isPracticed && 'border-2 border-streak',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs',
                        isPracticed ? 'font-bold text-white' : 'text-ink-soft',
                        day === null && 'opacity-0',
                      )}
                    >
                      {day === null ? '·' : Number(day.slice(-2))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
