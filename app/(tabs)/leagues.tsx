import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { IconShield, IconTrophy } from '@/components/icons';
import { cn } from '@/lib/cn';
import { CURRENT_LEAGUE, LEAGUE_RIVALS } from '@/lib/mockContent';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';

const BRAND_COLOR = '#8B5CF6';
/** Oro, plata y bronce para el podio. */
const PODIUM_COLORS = ['#EAB308', '#94A3B8', '#C2410C'];

interface RankingEntry {
  id: string;
  username: string;
  weeklyXp: number;
  color: string;
  isMe: boolean;
}

export default function LeaguesScreen() {
  const user = useAuthStore((state) => state.user);
  // TODO(api): usar el XP semanal real. Mientras no exista, mostramos el total.
  const xp = useProgressStore((state) => state.xp);

  const ranking: RankingEntry[] = [
    ...LEAGUE_RIVALS.map((rival) => ({ ...rival, isMe: false })),
    { id: 'me', username: user?.username ?? 'Tú', weeklyXp: xp, color: BRAND_COLOR, isMe: true },
  ].sort((a, b) => b.weeklyXp - a.weeklyXp);

  const demotionStart = ranking.length - CURRENT_LEAGUE.demotionSlots;

  return (
    <Screen scroll edges={['top']}>
      {/* Cabecera de la liga */}
      <View className="items-center pb-2 pt-4">
        <View
          style={{ backgroundColor: `${CURRENT_LEAGUE.color}22` }}
          className="h-24 w-24 items-center justify-center rounded-full"
        >
          <IconShield size={56} color={CURRENT_LEAGUE.color} filled strokeWidth={1.6} />
        </View>
        <Text className="mt-3 text-2xl font-extrabold text-ink">{CURRENT_LEAGUE.name}</Text>
        <Text className="mt-1 text-center text-sm text-ink-muted">
          Los {CURRENT_LEAGUE.promotionSlots} primeros suben de liga. Quedan {CURRENT_LEAGUE.daysLeft} días.
        </Text>
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {ranking.map((entry, index) => {
          const position = index + 1;
          const promoted = index < CURRENT_LEAGUE.promotionSlots;
          const demoted = index >= demotionStart;

          return (
            <View key={entry.id}>
              {index === CURRENT_LEAGUE.promotionSlots ? (
                <View className="flex-row items-center gap-2 bg-success-soft px-4 py-1.5">
                  <Text className="text-[10px] font-extrabold uppercase tracking-widest text-success">
                    ▲ Zona de ascenso
                  </Text>
                </View>
              ) : null}
              {index === demotionStart ? (
                <View className="flex-row items-center gap-2 bg-danger-soft px-4 py-1.5">
                  <Text className="text-[10px] font-extrabold uppercase tracking-widest text-danger">
                    ▼ Zona de descenso
                  </Text>
                </View>
              ) : null}

              <View
                className={cn(
                  'flex-row items-center gap-3 border-b border-line px-4 py-3',
                  entry.isMe && 'bg-brand-soft',
                )}
              >
                <View className="w-7 items-center">
                  {index < PODIUM_COLORS.length ? (
                    <IconTrophy size={20} color={PODIUM_COLORS[index]} filled />
                  ) : (
                    <Text
                      className={cn(
                        'text-sm font-extrabold',
                        promoted ? 'text-success' : demoted ? 'text-danger' : 'text-ink-muted',
                      )}
                    >
                      {position}
                    </Text>
                  )}
                </View>

                <View
                  style={{ backgroundColor: entry.color }}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <Text className="text-base font-extrabold text-white">
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  className={cn('flex-1 text-sm', entry.isMe ? 'font-extrabold text-brand-ink' : 'font-semibold text-ink')}
                >
                  {entry.isMe ? `${entry.username} (tú)` : entry.username}
                </Text>

                <Text className="text-sm font-bold text-ink-soft">{entry.weeklyXp} XP</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
