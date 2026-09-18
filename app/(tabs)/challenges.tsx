import { ActivityIndicator, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { IconBolt, IconCheck, IconGift, IconSignalOff, IconTarget, IconTrophy } from '@/components/icons';
import { useMissions } from '@/hooks/useContent';
import { useThemeColors } from '@/store/themeStore';
import type { ApiMission } from '@/types/api';

function QuestRow({ quest }: { quest: ApiMission }) {
  const colors = useThemeColors();
  const done = quest.completed || quest.currentValue >= quest.targetValue;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      <View
        className={
          done
            ? 'h-11 w-11 items-center justify-center rounded-xl bg-success-soft'
            : 'h-11 w-11 items-center justify-center rounded-xl bg-warning-soft'
        }
      >
        {done ? (
          <IconCheck size={22} color={colors.success} strokeWidth={2.6} />
        ) : (
          <IconBolt size={22} color={colors.warning} filled />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{quest.name}</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <ProgressBar
            value={quest.currentValue / quest.targetValue}
            className="h-2.5 flex-1"
            fillClassName={done ? 'bg-success' : 'bg-warning'}
            label={quest.name}
          />
          <Text className="text-xs font-bold text-ink-muted">
            {Math.min(quest.currentValue, quest.targetValue)}/{quest.targetValue}
          </Text>
        </View>
      </View>

      <View className="items-center">
        <IconGift size={22} color={done ? colors.success : '#94A3B8'} filled={done} />
        <Text className="mt-0.5 text-[10px] font-extrabold text-ink-muted">+{quest.xpReward}</Text>
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const colors = useThemeColors();
  const missions = useMissions();
  const dailyQuests = (missions.data ?? []).filter((mission) => mission.isDaily);
  // Hoy solo hay un reto no-diario sembrado (el mensual); si hubiera varios,
  // se mostraría el primero como destacado.
  const monthlyChallenge = (missions.data ?? []).find((mission) => !mission.isDaily) ?? null;
  const completedQuests = dailyQuests.filter((quest) => quest.completed).length;

  return (
    <Screen scroll edges={['top']} header={<AppHeader />}>
      <View className="py-2">
        <Text className="text-2xl font-extrabold text-ink">Desafíos</Text>
        <Text className="mt-1 text-xs text-ink-muted">Cumple misiones y gana recompensas extra.</Text>
      </View>

      {missions.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : missions.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudieron cargar los desafíos"
          description={missions.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="mt-4"
        />
      ) : (
        <>
          {/* Reto del mes */}
          {monthlyChallenge ? (
            <View className="mt-3 rounded-3xl bg-brand p-5">
              <View className="flex-row items-center gap-2">
                <IconTrophy size={20} color="#FFFFFF" filled />
                <Text className="text-xs font-extrabold uppercase tracking-widest text-white/80">Reto del mes</Text>
              </View>
              <Text className="mt-2 text-xl font-extrabold text-white">{monthlyChallenge.name}</Text>
              <Text className="mt-1 text-sm leading-5 text-white/85">{monthlyChallenge.description}</Text>
              <View className="mt-4 flex-row items-center gap-3">
                <ProgressBar
                  value={monthlyChallenge.currentValue / monthlyChallenge.targetValue}
                  className="h-3 flex-1 bg-white/25"
                  fillClassName="bg-white"
                  label="Progreso del reto del mes"
                />
                <Text className="text-sm font-extrabold text-white">
                  {monthlyChallenge.currentValue}/{monthlyChallenge.targetValue}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Misiones del día */}
          <View className="mb-3 mt-7 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <IconTarget size={20} color={colors.brand} filled />
              <Text className="text-lg font-extrabold text-ink">Misiones del día</Text>
            </View>
            <Text className="text-xs font-bold text-ink-muted">
              {completedQuests}/{dailyQuests.length}
            </Text>
          </View>

          {dailyQuests.length === 0 ? (
            <EmptyState
              icon={<IconTarget size={40} color={colors.inkMuted} />}
              title="Sin misiones por ahora"
              description="Todavía no hay misiones diarias configuradas."
            />
          ) : (
            <View className="gap-3">
              {dailyQuests.map((quest) => (
                <QuestRow key={quest.id} quest={quest} />
              ))}
            </View>
          )}

          <Text className="mt-6 text-center text-xs text-ink-muted">
            Las misiones se renuevan cada día a medianoche.
          </Text>
        </>
      )}
    </Screen>
  );
}
