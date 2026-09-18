import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { IconChevronRight, IconLock, IconSignalOff, IconUser } from '@/components/icons';
import { useClubs } from '@/hooks/useContent';
import { useThemeColors } from '@/store/themeStore';
import type { ApiClub } from '@/types/api';

function ClubCard({ club, onPress }: { club: ApiClub; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, ${club.memberCount} miembros`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-line border-b-4 bg-surface p-4 active:translate-y-px"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
        <IconUser size={22} color={colors.brand} filled />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-ink">
            {club.name}
          </Text>
          {!club.isPublic ? <IconLock size={14} color={colors.inkMuted} /> : null}
        </View>
        {club.description ? (
          <Text numberOfLines={1} className="text-xs font-medium text-ink-soft">
            {club.description}
          </Text>
        ) : null}
        <Text className="mt-0.5 text-[11px] font-bold text-ink-muted">
          {club.memberCount} {club.memberCount === 1 ? 'miembro' : 'miembros'}
        </Text>
      </View>
      <IconChevronRight size={16} color={colors.inkMuted} />
    </Pressable>
  );
}

export default function ClubsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const clubs = useClubs();

  return (
    <Screen scroll edges={['top']}>
      <View className="py-2">
        <Text className="text-2xl font-extrabold text-ink">Clanes</Text>
        <Text className="mt-1 text-xs text-ink-muted">Únete a un clan y practica en equipo.</Text>
      </View>

      {clubs.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : clubs.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudieron cargar los clanes"
          description={clubs.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="mt-4"
        />
      ) : (clubs.data ?? []).length === 0 ? (
        <EmptyState
          icon={<IconUser size={40} color={colors.inkMuted} />}
          title="Próximamente"
          description="Todavía no hay clanes creados."
          className="mt-4"
        />
      ) : (
        <View className="mt-3 gap-3">
          {(clubs.data ?? []).map((club) => (
            <ClubCard key={club.id} club={club} onPress={() => router.push(`/club/${club.id}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
