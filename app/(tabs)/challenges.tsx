import { Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { IconBolt, IconCheck, IconGift, IconTarget, IconTrophy } from '@/components/icons';
import { DAILY_QUESTS, MONTHLY_CHALLENGE, type DailyQuest } from '@/lib/mockContent';
import { useThemeColors } from '@/store/themeStore';


function QuestRow({ quest }: { quest: DailyQuest }) {
  const colors = useThemeColors();
  const done = quest.current >= quest.target;

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
        <Text className="text-sm font-bold text-ink">{quest.title}</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <ProgressBar
            value={quest.current / quest.target}
            className="h-2.5 flex-1"
            fillClassName={done ? 'bg-success' : 'bg-warning'}
            label={quest.title}
          />
          <Text className="text-xs font-bold text-ink-muted">
            {Math.min(quest.current, quest.target)}/{quest.target}
          </Text>
        </View>
      </View>

      <View className="items-center">
        <IconGift size={22} color={done ? colors.success : '#94A3B8'} filled={done} />
        <Text className="mt-0.5 text-[10px] font-extrabold text-ink-muted">+{quest.rewardXp}</Text>
      </View>
    </View>
  );
}

export default function ChallengesScreen() {
  const colors = useThemeColors();
  const completedQuests = DAILY_QUESTS.filter((quest) => quest.current >= quest.target).length;

  return (
    <Screen scroll edges={['top']} header={<AppHeader />}>
      <View className="py-2">
        <Text className="text-2xl font-extrabold text-ink">Desafíos</Text>
        <Text className="mt-1 text-xs text-ink-muted">Cumple misiones y gana recompensas extra.</Text>
      </View>

      {/* Reto del mes */}
      <View className="mt-3 rounded-3xl bg-brand p-5">
        <View className="flex-row items-center gap-2">
          <IconTrophy size={20} color="#FFFFFF" filled />
          <Text className="text-xs font-extrabold uppercase tracking-widest text-white/80">
            Reto del mes · quedan {MONTHLY_CHALLENGE.daysLeft} días
          </Text>
        </View>
        <Text className="mt-2 text-xl font-extrabold text-white">{MONTHLY_CHALLENGE.title}</Text>
        <Text className="mt-1 text-sm leading-5 text-white/85">{MONTHLY_CHALLENGE.description}</Text>
        <View className="mt-4 flex-row items-center gap-3">
          <ProgressBar
            value={MONTHLY_CHALLENGE.current / MONTHLY_CHALLENGE.target}
            className="h-3 flex-1 bg-white/25"
            fillClassName="bg-white"
            label="Progreso del reto del mes"
          />
          <Text className="text-sm font-extrabold text-white">
            {MONTHLY_CHALLENGE.current}/{MONTHLY_CHALLENGE.target}
          </Text>
        </View>
      </View>

      {/* Misiones del día */}
      <View className="mb-3 mt-7 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <IconTarget size={20} color={colors.brand} filled />
          <Text className="text-lg font-extrabold text-ink">Misiones del día</Text>
        </View>
        <Text className="text-xs font-bold text-ink-muted">
          {completedQuests}/{DAILY_QUESTS.length}
        </Text>
      </View>

      <View className="gap-3">
        {DAILY_QUESTS.map((quest) => (
          <QuestRow key={quest.id} quest={quest} />
        ))}
      </View>

      <Text className="mt-6 text-center text-xs text-ink-muted">Las misiones se renuevan cada día a medianoche.</Text>
    </Screen>
  );
}
