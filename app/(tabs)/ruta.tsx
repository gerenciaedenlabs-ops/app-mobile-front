import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { IconClock, IconSignalOff } from '@/components/icons';
import { LessonStartModal } from '@/features/skill-tree/LessonStartModal';
import { UnitPath } from '@/features/skill-tree/UnitPath';
import { useCurriculum, useInstruments } from '@/hooks/useContent';
import { formatDuration } from '@/lib/datetime';
import { msUntilNextHeart } from '@/lib/hearts';
import { buildTree } from '@/lib/unlock';
import { useCompletedLessonIds, useProgressStore } from '@/store/progressStore';
import { useThemeColors } from '@/store/themeStore';
import type { Lesson } from '@/types/content';

export default function RutaScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const hearts = useProgressStore((state) => state.hearts);
  const isPremium = useProgressStore((state) => state.isPremium);
  const completed = useCompletedLessonIds();
  const lastInstrumentId = useProgressStore((state) => state.lastInstrumentId);

  const instruments = useInstruments();

  // Solo mostramos la ruta del instrumento que el alumno eligió. Sin elección
  // previa no adivinamos: lo mandamos al catálogo.
  const instrumentId = lastInstrumentId ?? '';
  const instrument = instruments.data?.find((candidate) => candidate.id === instrumentId);

  const curriculumState = useCurriculum(instrumentId);
  const curriculum = curriculumState.data ?? [];
  const tree = useMemo(() => buildTree(curriculum, completed), [curriculum, completed]);

  // Lección elegida en el camino, a la espera de confirmar en la hoja inferior.
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!instrumentId) router.replace('/(tabs)/courses');
  }, [instrumentId, router]);

  const header = <AppHeader instrument={instrument} instruments={instruments.data} />;

  if (!instrumentId || instruments.status === 'loading') {
    return (
      <Screen edges={['top']} header={header}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (instruments.status === 'error') {
    return (
      <Screen edges={['top']} header={header}>
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudo cargar el instrumento"
          description={instruments.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="flex-1"
        />
      </Screen>
    );
  }

  if (!instrument) {
    return (
      <Screen edges={['top']} header={header}>
        <EmptyState
          icon={<IconClock size={40} color={colors.inkMuted} />}
          title="Instrumento desconocido"
          description="No se ha seleccionado ningún curso."
          className="flex-1"
        />
      </Screen>
    );
  }

  const openLesson = (lesson: Lesson) => {
    if (lesson.isPremium && !isPremium) {
      router.push('/paywall');
      return;
    }

    if (hearts.current <= 0) {
      const remaining = msUntilNextHeart(hearts);
      Alert.alert(
        'Te quedaste sin vidas',
        remaining === null
          ? 'Espera un poco para recuperar vidas.'
          : `La próxima vida llega en ${formatDuration(remaining)}.`,
        [
          { text: 'Esperar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => router.push('/paywall') },
        ],
      );
      return;
    }

    router.push(`/lesson/${lesson.id}?instrumentId=${instrument.id}&xpReward=${lesson.xpReward}`);
  };

  // Datos de la lección seleccionada para la hoja inferior.
  const selectedUnit = tree.find((unit) => unit.nodes.some((node) => node.lesson.id === selectedLessonId));
  const selectedIndex = selectedUnit?.nodes.findIndex((node) => node.lesson.id === selectedLessonId) ?? -1;
  const selectedNode = selectedUnit?.nodes[selectedIndex];

  return (
    <Screen scroll edges={['top']} header={header}>
      {curriculumState.status === 'loading' ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : curriculumState.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudo cargar el curso"
          description={curriculumState.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
        />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<IconClock size={40} color={colors.inkMuted} />}
          title="Próximamente"
          description={`Estamos preparando el curso de ${instrument.name.toLowerCase()}.`}
        />
      ) : (
        <View className="mt-4 pb-8">
          {tree.map((unitTree) => (
            <UnitPath
              key={unitTree.unit.id}
              tree={unitTree}
              onSelectLesson={(lesson) => setSelectedLessonId(lesson.id)}
            />
          ))}
        </View>
      )}

      <LessonStartModal
        lesson={selectedNode?.lesson ?? null}
        state={selectedNode?.state ?? null}
        position={selectedIndex + 1}
        total={selectedUnit?.nodes.length ?? 0}
        onClose={() => setSelectedLessonId(null)}
        onStart={(lesson) => {
          setSelectedLessonId(null);
          openLesson(lesson);
        }}
      />
    </Screen>
  );
}
