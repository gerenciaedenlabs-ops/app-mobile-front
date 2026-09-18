import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { IconLock, IconSignalOff, IconUser } from '@/components/icons';
import { useClub } from '@/hooks/useContent';
import { useThemeColors } from '@/store/themeStore';

export default function ClubDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useClub(clubId);

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <Text numberOfLines={1} className="flex-1 text-2xl font-extrabold text-ink">
          {club.data?.name ?? 'Clan'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <Text className="text-base font-bold text-ink-soft">✕</Text>
        </Pressable>
      </View>

      {club.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : club.status === 'error' || !club.data ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudo cargar el clan"
          description={club.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="mt-4"
        />
      ) : (
        <View className="mt-2 gap-4">
          <View className="gap-2 rounded-2xl border border-line border-b-4 bg-surface p-4">
            <View className="flex-row items-center gap-2">
              {!club.data.isPublic ? <IconLock size={14} color={colors.inkMuted} /> : null}
              <Text className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                {club.data.isPublic ? 'Clan público' : 'Clan privado'} · {club.data.memberCount}{' '}
                {club.data.memberCount === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
            {club.data.description ? (
              <Text className="text-sm leading-5 text-ink-soft">{club.data.description}</Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="px-1 text-base font-bold text-ink">Miembros</Text>
            {club.data.members.length === 0 ? (
              <EmptyState
                icon={<IconUser size={32} color={colors.inkMuted} />}
                title="Sin miembros todavía"
                description="Este clan no tiene miembros por ahora."
              />
            ) : (
              <View className="overflow-hidden rounded-2xl border border-line bg-surface">
                {club.data.members.map((member) => (
                  <View
                    key={member.userId}
                    className="flex-row items-center gap-3 border-b border-line px-4 py-3"
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised">
                      <IconUser size={16} color={colors.inkMuted} />
                    </View>
                    {/* TODO(api): el backend todavía no incluye username en los miembros del clan. */}
                    <Text className="flex-1 text-sm font-semibold text-ink">Miembro</Text>
                    <Text className="text-xs font-bold uppercase text-ink-muted">{member.roleName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}
