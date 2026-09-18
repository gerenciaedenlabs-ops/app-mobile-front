import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TactileButton } from '@/components/TactileButton';
import { IconBell, IconMusicList, IconPlay, IconSignalOff, IconSliders } from '@/components/icons';
import { useCurriculaByInstrument, useInstruments } from '@/hooks/useContent';
import { cn } from '@/lib/cn';
import { todayKey } from '@/lib/datetime';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { getEffectiveStreak } from '@/lib/streak';
import { GAME_COLORS } from '@/lib/theme';
import { countCompleted } from '@/lib/unlock';
import { useAuthStore } from '@/store/authStore';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';
import { useThemeColors } from '@/store/themeStore';
import type { Instrument } from '@/types/content';

type CourseStatus = 'in-progress' | 'new' | 'soon';

interface CourseCardProps {
  instrument: Instrument;
  status: CourseStatus;
  completedLessons: number;
  totalLessons: number;
  onOpen: () => void;
}

/** Recuadro del emoji del instrumento, teñido con su color de acento. */
function InstrumentBadge({ instrument, muted = false }: { instrument: Instrument; muted?: boolean }) {
  return (
    <View
      style={muted ? undefined : { backgroundColor: `${instrument.accentColor}26`, borderColor: `${instrument.accentColor}55` }}
      className={cn(
        'h-12 w-12 items-center justify-center rounded-xl border border-b-2',
        muted && 'border-line bg-surface-raised',
      )}
    >
      <Text className="text-2xl">{instrument.icon}</Text>
    </View>
  );
}

function StatusTag({ status }: { status: CourseStatus }) {
  if (status === 'in-progress') {
    return (
      <View className="rounded-full bg-brand-soft px-2 py-0.5">
        <Text className="text-[11px] font-extrabold uppercase tracking-wide text-brand-ink">En curso</Text>
      </View>
    );
  }
  if (status === 'new') {
    return (
      <View className="rounded-full bg-[#C8E6FF] px-2 py-0.5">
        <Text className="text-[11px] font-extrabold uppercase text-[#004C6E]">Nuevo</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-warning-soft px-1.5 py-0.5">
      <Text className="text-[10px] font-extrabold uppercase text-warning">Próx.</Text>
    </View>
  );
}

function CourseCard({ instrument, status, completedLessons, totalLessons, onOpen }: CourseCardProps) {
  const colors = useThemeColors();

  if (status === 'soon') {
    return (
      <View className="flex-row items-center justify-between gap-3 rounded-[20px] border-2 border-line border-b-4 bg-surface p-4">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <InstrumentBadge instrument={instrument} muted />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-[17px] font-extrabold text-ink">{instrument.name}</Text>
              <StatusTag status={status} />
            </View>
            <Text numberOfLines={1} className="text-xs font-medium text-ink-soft">
              {instrument.tagline}
            </Text>
          </View>
        </View>
        <TactileButton
          label="Avisar"
          uppercase={false}
          height={36}
          radius={12}
          lip={3}
          color={colors.surfaceRaised}
          lipColor={colors.line}
          textColor={colors.ink}
          textClassName="text-xs"
          icon={<IconBell size={15} color={colors.ink} />}
          accessibilityHint="Información sobre este curso próximo"
          // TODO(api): no hay aún suscripción a avisos por curso en el backend.
          onPress={() =>
            Alert.alert(
              `${instrument.name}: próximamente`,
              'Todavía no enviamos avisos. Este curso aparecerá aquí en cuanto tenga lecciones.',
            )
          }
        />
      </View>
    );
  }

  const inProgress = status === 'in-progress';
  const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;

  return (
    <View
      className={cn(
        'gap-3 rounded-[20px] border-2 border-b-4 bg-surface p-4',
        inProgress ? 'border-brand/40' : 'border-line',
      )}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <InstrumentBadge instrument={instrument} />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-extrabold text-ink">{instrument.name}</Text>
              <StatusTag status={status} />
            </View>
            <Text numberOfLines={1} className="text-xs font-medium text-ink-soft">
              {instrument.tagline}
            </Text>
          </View>
        </View>
        {inProgress ? (
          <View className="rounded-full bg-brand-soft px-2 py-1">
            <Text className="text-xs font-extrabold text-brand-ink">
              {completedLessons}/{totalLessons} lecc.
            </Text>
          </View>
        ) : (
          <Text className="text-[11px] font-semibold text-ink-soft">
            {completedLessons}/{totalLessons} lecc.
          </Text>
        )}
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Progreso de ${instrument.name}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line p-0.5"
      >
        <View style={{ width: `${Math.round(progress * 100)}%` }} className="h-full rounded-full bg-[#58CC02]" />
      </View>

      <TactileButton
        label={`${inProgress ? 'Continuar' : 'Empezar'} ${instrument.name}`}
        height={44}
        radius={12}
        color={inProgress ? GAME_COLORS.green.fill : GAME_COLORS.blue.fill}
        lipColor={inProgress ? GAME_COLORS.green.lip : GAME_COLORS.blue.lip}
        icon={
          inProgress ? (
            <IconPlay size={18} color="#FFFFFF" filled strokeWidth={2.4} />
          ) : (
            <IconMusicList size={18} color="#FFFFFF" strokeWidth={2.4} />
          )
        }
        onPress={onOpen}
      />
    </View>
  );
}

export default function CoursesScreen() {
  const router = useRouter();

  const streak = useProgressStore((state) => state.streak);
  const isPremium = useProgressStore((state) => state.isPremium);
  const lastInstrumentId = useProgressStore((state) => state.lastInstrumentId);
  const setLastInstrument = useProgressStore((state) => state.setLastInstrument);
  const user = useAuthStore((state) => state.user);
  const completed = useCompletedLessonIds();
  const colors = useThemeColors();

  const instruments = useInstruments();
  const curricula = useCurriculaByInstrument((instruments.data ?? []).map((instrument) => instrument.id));
  const currentStreak = getEffectiveStreak(streak, todayKey());
  const currentInstrument = instruments.data?.find((instrument) => instrument.id === lastInstrumentId);
  const greetingName = user?.displayName || user?.username;

  const openInstrument = (instrumentId: string) => {
    setLastInstrument(instrumentId);
    router.replace('/(tabs)/ruta');
  };

  return (
    <Screen scroll edges={['top']} header={<AppHeader instrument={currentInstrument} instruments={instruments.data} />}>
      {/* Bienvenida con la mascota */}
      <View className="mt-3 flex-row items-center gap-3 overflow-hidden rounded-[20px] border-2 border-line border-b-4 bg-surface p-4">
        <View className="h-20 w-20 items-center justify-center">
          <Image
            source={require('@/assets/brand/mascot.png')}
            accessibilityIgnoresInvertColors
            style={{ width: 80, height: 81 }}
            resizeMode="contain"
          />
          {isPremium ? (
            <View className="absolute -bottom-1 right-0 rounded-full border-b-2 border-[#CCA000] bg-[#FEC700] px-1.5 py-0.5">
              <Text className="text-[9px] font-black uppercase text-[#6E5400]">Pro</Text>
            </View>
          ) : null}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[19px] font-extrabold text-ink">
            ¡Hola{greetingName ? `, ${greetingName}` : ''}! 👋
          </Text>
          {currentStreak > 0 ? (
            <Text className="mt-0.5 text-[13px] font-medium leading-[18px] text-ink-soft">
              Tu racha de{' '}
              <Text className="font-bold text-[#B45309]">
                {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
              </Text>{' '}
              está activa en todos los instrumentos.
            </Text>
          ) : (
            <Text className="mt-0.5 text-[13px] font-medium leading-[18px] text-ink-soft">
              Completa una lección hoy para empezar tu racha.
            </Text>
          )}
        </View>
      </View>

      {instruments.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : instruments.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudieron cargar los instrumentos"
          description={instruments.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="mt-4"
        />
      ) : (
        <View className="mt-4 gap-3.5">
          {/* El último instrumento abierto va primero. */}
          {[...(instruments.data ?? [])]
            .sort((a, b) => Number(b.id === lastInstrumentId) - Number(a.id === lastInstrumentId))
            .map((instrument) => {
              const curriculum = curricula.data?.[instrument.id] ?? [];
              const totalLessons = curriculum.reduce((sum, entry) => sum + entry.lessons.length, 0);
              const completedLessons = countCompleted(curriculum, completed);
              const status: CourseStatus =
                totalLessons === 0
                  ? 'soon'
                  : instrument.id === lastInstrumentId || completedLessons > 0
                    ? 'in-progress'
                    : 'new';

              return (
                <CourseCard
                  key={instrument.id}
                  instrument={instrument}
                  status={status}
                  completedLessons={completedLessons}
                  totalLessons={totalLessons}
                  onOpen={() => openInstrument(instrument.id)}
                />
              );
            })}
        </View>
      )}

      {DEVELOPMENT_SECTION_ENABLED ? (
        <View className="mt-3.5 flex-row items-center justify-between gap-3 rounded-[20px] border-2 border-b-4 border-[#C8E6FF] bg-[#F0F9FF] p-4 dark:border-cyan-900 dark:bg-cyan-950">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir el laboratorio de sonido"
            onPress={() => router.push('/development')}
            className="min-w-0 flex-1 flex-row items-center gap-3"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#4ABDFF]/30">
              <IconSliders size={22} color={colors.devAccent} />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text style={{ color: colors.devAccent }} className="text-[15px] font-bold">
                  Laboratorio de Sonido
                </Text>
                <View className="rounded-md bg-[#006590] px-1">
                  <Text className="text-[9px] font-extrabold text-white">BETA</Text>
                </View>
              </View>
              <Text numberOfLines={1} className="text-xs font-medium text-ink-soft">
                Afinador y detector de tono en vivo
              </Text>
            </View>
          </Pressable>
          <TactileButton
            label="Probar"
            uppercase={false}
            height={36}
            radius={12}
            lip={3}
            color={GAME_COLORS.blue.fill}
            lipColor={GAME_COLORS.blue.lip}
            textClassName="text-xs"
            icon={<IconSliders size={15} color="#FFFFFF" strokeWidth={2.2} />}
            onPress={() => router.push('/development')}
          />
        </View>
      ) : null}
    </Screen>
  );
}
