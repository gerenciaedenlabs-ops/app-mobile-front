import { ActivityIndicator, Image, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { IconClock, IconShield, IconSignalOff, IconTrophy } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useLeague } from '@/hooks/useContent';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';
import type { ApiLeagueRankingEntry } from '@/types/api';

const BRAND_COLOR = '#8B5CF6';
/** Oro, plata y bronce para el podio. */
const PODIUM_COLORS = ['#EAB308', '#94A3B8', '#C2410C'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Orden real: por posición final si la temporada ya cerró, si no por XP semanal. */
function sortRanking(ranking: readonly ApiLeagueRankingEntry[]): ApiLeagueRankingEntry[] {
  const hasFinalPositions = ranking.some((entry) => entry.finalPosition !== null);
  return [...ranking].sort((a, b) =>
    hasFinalPositions
      ? (a.finalPosition ?? Number.MAX_SAFE_INTEGER) - (b.finalPosition ?? Number.MAX_SAFE_INTEGER)
      : b.weeklyXp - a.weeklyXp,
  );
}

export default function LeaguesScreen() {
  const colors = useThemeColors();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const league = useLeague();

  if (league.status === 'loading') {
    return (
      <Screen edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (league.status === 'error') {
    return (
      <Screen edges={['top']}>
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudo cargar tu liga"
          description={league.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="flex-1"
        />
      </Screen>
    );
  }

  if (!league.data) {
    return (
      <Screen edges={['top']}>
        <EmptyState
          icon={<IconClock size={40} color={colors.inkMuted} />}
          title="Sin temporada activa"
          description="Todavía no hay una liga en curso. Vuelve pronto."
          className="flex-1"
        />
      </Screen>
    );
  }

  const data = league.data;
  const daysLeft = Math.max(0, Math.ceil((new Date(data.seasonEndsAt).getTime() - Date.now()) / MS_PER_DAY));
  const ranking = sortRanking(data.ranking);

  return (
    <Screen scroll edges={['top']}>
      {/* Cabecera de la liga */}
      <View className="items-center pb-2 pt-4">
        <View style={{ backgroundColor: `${BRAND_COLOR}22` }} className="h-24 w-24 items-center justify-center rounded-full">
          <IconShield size={56} color={BRAND_COLOR} filled strokeWidth={1.6} />
        </View>
        <Text className="mt-3 text-2xl font-extrabold text-ink">{data.levelName}</Text>
        <Text className="mt-1 text-center text-sm text-ink-muted">
          {daysLeft > 0 ? `Quedan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}.` : 'La temporada cierra hoy.'}
        </Text>
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {ranking.map((entry, index) => {
          const position = index + 1;
          const isMe = entry.userId === currentUserId;
          const displayName = isMe ? 'Tú' : entry.displayName;

          return (
            <View
              key={entry.userId}
              className={cn('flex-row items-center gap-3 border-b border-line px-4 py-3', isMe && 'bg-brand-soft')}
            >
              <View className="w-7 items-center">
                {index < PODIUM_COLORS.length ? (
                  <IconTrophy size={20} color={PODIUM_COLORS[index]} filled />
                ) : (
                  <Text className="text-sm font-extrabold text-ink-muted">{position}</Text>
                )}
              </View>

              <View
                style={{ backgroundColor: isMe ? BRAND_COLOR : colors.surfaceRaised }}
                className="h-10 w-10 items-center justify-center overflow-hidden rounded-full"
              >
                {entry.avatarUrl ? (
                  <Image
                    source={{ uri: entry.avatarUrl }}
                    accessibilityIgnoresInvertColors
                    style={{ width: 40, height: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className={cn('text-base font-extrabold', isMe ? 'text-white' : 'text-ink-muted')}>
                    {entry.displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <Text
                numberOfLines={1}
                className={cn('flex-1 text-sm', isMe ? 'font-extrabold text-brand-ink' : 'font-semibold text-ink')}
              >
                {displayName}
              </Text>

              <Text className="text-sm font-bold text-ink-soft">{entry.weeklyXp} XP</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
