import { type Href, useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { HeartsBar } from '@/components/HeartsBar';
import { Screen } from '@/components/Screen';
import { getCurriculum, getInstruments } from '@/content';
import { StatTile } from '@/features/profile/StatTile';
import { StreakCalendar } from '@/features/profile/StreakCalendar';
import { useNextHeartCountdown } from '@/hooks/useHearts';
import { formatDuration, todayKey } from '@/lib/datetime';
import { getEffectiveStreak, isStreakAtRisk } from '@/lib/streak';
import { countCompleted } from '@/lib/unlock';
import { useAuthStore } from '@/store/authStore';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const isDeletingAccount = useAuthStore((state) => state.isDeletingAccount);

  const xp = useProgressStore((state) => state.xp);
  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);
  const practiceDays = useProgressStore((state) => state.practiceDays);
  const isPremium = useProgressStore((state) => state.isPremium);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const completed = useCompletedLessonIds();
  const remainingMs = useNextHeartCountdown();

  const today = todayKey();
  const currentStreak = getEffectiveStreak(streak, today);
  const atRisk = isStreakAtRisk(streak, today);

  const confirmReset = () => {
    Alert.alert('Reiniciar progreso', 'Se borrarán XP, racha y lecciones completadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: resetProgress },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Borrar cuenta',
      'Se eliminará todo: tu cuenta, perfil, acceso con Google y progreso. Esta acción no se puede deshacer. ¿Seguro que quieres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar cuenta',
          style: 'destructive',
          onPress: () => {
            void deleteAccount()
              .then(() => router.replace('/login' as Href))
              .catch((error: unknown) => {
                Alert.alert(
                  'No se pudo borrar la cuenta',
                  error instanceof Error ? error.message : 'Inténtalo nuevamente.',
                );
              });
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-2xl font-extrabold text-ink">Tu progreso</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Text className="text-xl text-ink-muted">✕</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
          <Text className="text-xl">👤</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Usuario</Text>
          <Text className="mt-0.5 text-lg font-extrabold text-ink">{user?.username}</Text>
        </View>
      </View>

      {atRisk ? (
        <View className="mt-2 rounded-2xl bg-warning-soft p-4">
          <Text className="text-sm font-bold text-warning">🔥 Tu racha está en riesgo</Text>
          <Text className="mt-0.5 text-xs text-warning">
            Completa una lección hoy para no perder {currentStreak} día
            {currentStreak === 1 ? '' : 's'}.
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <StatTile icon="🔥" value={currentStreak} label="Días de racha" />
        <StatTile icon="⚡" value={xp} label="XP total" />
        <StatTile icon="🎓" value={completed.size} label="Lecciones" />
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <View>
          <Text className="text-sm font-bold text-ink">Vidas</Text>
          <Text className="text-xs text-ink-muted">
            {remainingMs === null
              ? 'Todas disponibles'
              : `Próxima en ${formatDuration(remainingMs)}`}
          </Text>
        </View>
        <HeartsBar current={hearts.current} max={hearts.max} />
      </View>

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">Calendario</Text>
      <StreakCalendar practiceDays={practiceDays} />

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">Por instrumento</Text>
      <View className="gap-2">
        {getInstruments().map((instrument) => {
          const curriculum = getCurriculum(instrument.id);
          const total = curriculum.reduce((sum, entry) => sum + entry.lessons.length, 0);

          return (
            <View
              key={instrument.id}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <Text className="text-xl">{instrument.icon}</Text>
              <Text className="flex-1 text-sm font-semibold text-ink">{instrument.name}</Text>
              <Text className="text-xs text-ink-muted">
                {total === 0
                  ? 'Sin lecciones'
                  : `${countCompleted(curriculum, completed)}/${total} completadas`}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="mt-8 gap-3">
        {!isPremium ? (
          <Button label="Hazte Premium" icon="👑" onPress={() => router.push('/paywall')} />
        ) : null}
        {/* Atajo de desarrollo: no debería llegar a producción tal cual. */}
        <Button label="Reiniciar progreso" variant="ghost" onPress={confirmReset} />
        <Button
          label="Cerrar sesión"
          variant="secondary"
          disabled={isDeletingAccount}
          onPress={() => {
            logout();
            router.replace('/login' as Href);
          }}
        />
        <Button
          label={isDeletingAccount ? 'Borrando cuenta…' : 'Borrar cuenta'}
          variant="danger"
          disabled={isDeletingAccount}
          onPress={confirmDeleteAccount}
          accessibilityHint="Elimina definitivamente tu cuenta y toda su información"
        />
      </View>
    </Screen>
  );
}
