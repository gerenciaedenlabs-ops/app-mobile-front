import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, Share, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TactileButton } from '@/components/TactileButton';
import {
  IconBolt,
  IconCheck,
  IconFlame,
  IconHeart,
  IconMusicNote,
  IconSettings,
  IconShare,
  IconSignalOff,
  IconTrophy,
} from '@/components/icons';
import { StreakCalendar } from '@/features/profile/StreakCalendar';
import { useAchievements, useInstruments } from '@/hooks/useContent';
import { useNextHeartCountdown } from '@/hooks/useHearts';
import { cn } from '@/lib/cn';
import { formatDuration, todayKey } from '@/lib/datetime';
import { getEffectiveStreak } from '@/lib/streak';
import { GAME_COLORS } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeColors } from '@/store/themeStore';
import type { ApiAchievement } from '@/types/api';

function AchievementBadge({ achievement }: { achievement: ApiAchievement }) {
  const colors = useThemeColors();
  return (
    <View className={cn('w-[92px] items-center gap-1.5 rounded-2xl border border-line bg-surface p-3', !achievement.unlocked && 'opacity-40')}>
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: achievement.unlocked ? '#FFF7D6' : colors.surfaceRaised }}
      >
        {achievement.iconUrl ? (
          <Image
            source={{ uri: achievement.iconUrl }}
            accessibilityIgnoresInvertColors
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        ) : (
          <IconTrophy size={20} color={achievement.unlocked ? '#EAB308' : colors.inkMuted} filled={achievement.unlocked} />
        )}
      </View>
      <Text numberOfLines={2} className="text-center text-[11px] font-bold text-ink">
        {achievement.name}
      </Text>
    </View>
  );
}

function StatCard({ icon, iconBg, value, label }: { icon: ReactNode; iconBg: string; value: string; label: string }) {
  return (
    <View className="flex-1 items-center justify-center rounded-2xl border border-line border-b-4 bg-surface p-3.5">
      <View style={{ backgroundColor: iconBg }} className="mb-1 h-9 w-9 items-center justify-center rounded-xl">
        {icon}
      </View>
      <Text numberOfLines={1} className="text-[17px] font-extrabold text-ink">
        {value}
      </Text>
      <Text className="text-[10px] font-extrabold uppercase tracking-wider text-ink-soft">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const xp = useProgressStore((state) => state.xp);
  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);
  const practiceDays = useProgressStore((state) => state.practiceDays);
  const totalLessonsCompleted = useProgressStore((state) => state.totalLessonsCompleted);
  const progressByInstrument = useProgressStore((state) => state.progressByInstrument);
  const isPremium = useProgressStore((state) => state.isPremium);
  const lastInstrumentId = useProgressStore((state) => state.lastInstrumentId);
  const refreshProgress = useProgressStore((state) => state.refreshProgress);
  const remainingMs = useNextHeartCountdown();
  const heartsFull = hearts.current >= hearts.max;

  // Para el ícono de cada instrumento y el selector de la cabecera.
  const instruments = useInstruments();
  const currentInstrument = instruments.data?.find((instrument) => instrument.id === lastInstrumentId);
  const achievements = useAchievements();

  // Refresca cada vez que se abre esta pantalla, para no mostrar datos viejos.
  useFocusEffect(
    useCallback(() => {
      void refreshProgress(token);
    }, [refreshProgress, token]),
  );

  const currentStreak = getEffectiveStreak(streak, todayKey());
  const displayName = user?.displayName || user?.username || '';

  const shareProgress = () => {
    void Share.share({
      message: `Llevo ${currentStreak} ${currentStreak === 1 ? 'día' : 'días'} de racha, ${xp} XP y ${totalLessonsCompleted} lecciones aprendiendo música en Ritmo 🎵`,
    });
  };

  return (
    <Screen scroll edges={['top']} header={<AppHeader instrument={currentInstrument} instruments={instruments.data} />}>
      <View className="gap-4 pb-6 pt-2">
        {/* Tarjeta de perfil */}
        <View className="items-center rounded-3xl border border-line border-b-4 bg-surface p-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configuración"
            onPress={() => router.push('/settings')}
            hitSlop={8}
            className="absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-full border-b-2 border-line bg-surface-sunken active:translate-y-px"
          >
            <IconSettings size={18} color={colors.inkMuted} />
          </Pressable>

          <View className="mb-2.5">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-brand-soft p-1">
              <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-b-[3px] border-line-strong bg-surface">
                <Image
                  source={require('@/assets/brand/app-icon.png')}
                  accessibilityIgnoresInvertColors
                  style={{ width: 76, height: 74 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            {isPremium ? (
              <View className="absolute -bottom-1.5 -right-1 flex-row items-center gap-0.5 rounded-full border-2 border-b-[3px] border-surface bg-[#F4BF00] px-2 py-0.5">
                <IconCheck size={11} color="#4A3B00" strokeWidth={3} />
                <Text className="text-[10px] font-extrabold tracking-wider text-[#4A3B00]">PRO</Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[26px] font-extrabold text-ink">{displayName}</Text>
          {user?.username ? <Text className="text-[13px] font-medium text-ink-soft">@{user.username}</Text> : null}
        </View>

        {/* Estadísticas */}
        <View className="flex-row gap-3">
          <StatCard
            icon={<IconFlame size={20} color={GAME_COLORS.flame.fill} filled />}
            iconBg="#FEC70033"
            value={`${currentStreak} ${currentStreak === 1 ? 'Día' : 'Días'}`}
            label="Racha"
          />
          <StatCard
            icon={<IconBolt size={18} color="#F4BF00" filled />}
            iconBg="#FFDF9266"
            value={`${xp} XP`}
            label="Total XP"
          />
          <StatCard
            icon={<IconMusicNote size={20} color="#006590" filled />}
            iconBg="#C8E6FF4D"
            value={`${totalLessonsCompleted} Hechas`}
            label="Lecciones"
          />
        </View>

        {/* Vidas */}
        <View className="gap-2.5 rounded-2xl border border-line border-b-4 bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <IconHeart size={20} color={colors.danger} filled />
              <Text className="text-base font-bold text-ink">Vidas y Energía</Text>
            </View>
            <View className="rounded-full bg-danger-soft px-2 py-0.5">
              <Text className="text-[11px] font-extrabold text-danger">
                {hearts.current} / {hearts.max}
                {heartsFull ? ' Llenas' : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between rounded-xl bg-surface-sunken px-3 py-2">
            <View accessibilityLabel={`${hearts.current} de ${hearts.max} vidas`} className="flex-row items-center gap-2.5">
              {Array.from({ length: hearts.max }, (_, index) => (
                <View key={index} className={index >= hearts.current ? 'opacity-25' : undefined}>
                  <IconHeart size={20} color={colors.danger} filled={index < hearts.current} />
                </View>
              ))}
            </View>
            <Text className="text-[11px] font-extrabold uppercase text-brand-ink">
              {heartsFull
                ? '¡Listo para tocar!'
                : remainingMs === null
                  ? 'Sincronizando…'
                  : `Próxima en ${formatDuration(remainingMs)}`}
            </Text>
          </View>
        </View>

        <StreakCalendar practiceDays={practiceDays} />

        {/* Logros por instrumento */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base font-bold text-ink">Logros por Instrumento</Text>
            <Pressable accessibilityRole="button" onPress={() => router.navigate('/(tabs)/courses')} hitSlop={8}>
              <Text className="text-[11px] font-bold uppercase text-brand-ink">Ver todos</Text>
            </Pressable>
          </View>

          {progressByInstrument.map((entry) => {
            const icon = instruments.data?.find((instrument) => instrument.id === entry.instrumentId)?.icon;
            const percent =
              entry.totalLessons === 0 ? 0 : Math.round((entry.completedLessons / entry.totalLessons) * 100);
            const done = entry.totalLessons > 0 && entry.completedLessons >= entry.totalLessons;

            return (
              <View key={entry.instrumentId} className="gap-2 rounded-2xl border border-line border-b-4 bg-surface p-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7D6] dark:bg-surface-raised">
                      {icon ? <Text className="text-xl">{icon}</Text> : <IconMusicNote size={20} color={colors.inkMuted} />}
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text numberOfLines={1} className="text-[15px] font-bold text-ink">
                          {entry.instrumentName}
                        </Text>
                        {done ? (
                          <View className="h-4 w-4 items-center justify-center rounded-full bg-[#58CC02]">
                            <IconCheck size={11} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-xs font-medium text-ink-soft">
                        {entry.totalLessons === 0
                          ? 'Próximamente'
                          : `${entry.completedLessons}/${entry.totalLessons} lecciones`}
                      </Text>
                    </View>
                  </View>
                  {done ? (
                    <View className="flex-row items-center gap-1 rounded-lg bg-surface-sunken px-2 py-1">
                      <Text className="text-sm">🥇</Text>
                      <Text className="text-[10px] font-extrabold text-warning">100%</Text>
                    </View>
                  ) : (
                    <View className="rounded-full bg-[#C8E6FF]/60 px-2 py-0.5">
                      <Text className="text-[11px] font-extrabold text-[#006590] dark:text-[#88CEFF]">{percent}%</Text>
                    </View>
                  )}
                </View>
                <View className="h-2.5 w-full overflow-hidden rounded-full bg-line">
                  <View style={{ width: `${percent}%` }} className="h-full rounded-full bg-[#58CC02]" />
                </View>
              </View>
            );
          })}
        </View>

        {/* Logros */}
        <View className="gap-2.5">
          <Text className="px-1 text-base font-bold text-ink">Logros</Text>

          {achievements.status === 'loading' ? (
            <ActivityIndicator color={colors.brand} />
          ) : achievements.status === 'error' ? (
            <EmptyState
              icon={<IconSignalOff size={32} color={colors.inkMuted} />}
              title="No se pudieron cargar los logros"
              description={achievements.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
            />
          ) : (achievements.data ?? []).length === 0 ? (
            <EmptyState
              icon={<IconTrophy size={32} color={colors.inkMuted} />}
              title="Sin logros todavía"
              description="Completa lecciones y misiones para desbloquear logros."
            />
          ) : (
            <View className="flex-row flex-wrap gap-2.5">
              {(achievements.data ?? []).map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </View>
          )}
        </View>

        <TactileButton
          label="Compartir mi progreso"
          height={52}
          color={GAME_COLORS.green.fill}
          lipColor="#1E5000"
          textColor="#1E5000"
          icon={<IconShare size={20} color="#1E5000" strokeWidth={2.2} />}
          className="pt-2"
          onPress={shareProgress}
        />
      </View>
    </Screen>
  );
}
