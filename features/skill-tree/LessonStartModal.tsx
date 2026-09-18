import { Modal, Pressable, Text, View } from 'react-native';

import { TactileButton } from '@/components/TactileButton';
import { IconBolt, IconMusicNote } from '@/components/icons';
import { GAME_COLORS } from '@/lib/theme';
import { useThemeColors } from '@/store/themeStore';
import type { Lesson, LessonState } from '@/types/content';

interface LessonStartModalProps {
  lesson: Lesson | null;
  state: LessonState | null;
  /** Posición de la lección en su unidad (1-based) y total de la unidad. */
  position: number;
  total: number;
  onClose: () => void;
  onStart: (lesson: Lesson) => void;
}

/** Hoja inferior previa a la lección (Diseno Nuevo/ruta: #lesson-modal). */
export function LessonStartModal({ lesson, state, position, total, onClose, onStart }: LessonStartModalProps) {
  const colors = useThemeColors();
  const review = state === 'completed';

  return (
    <Modal visible={lesson !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onClose}
        className="flex-1 justify-end bg-black/40 p-4"
      >
        {lesson ? (
          // El Pressable interior evita que un toque dentro de la hoja la cierre.
          <Pressable onPress={() => undefined} className="w-full rounded-3xl bg-surface p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="rounded-full bg-brand-soft px-3 py-1">
                <Text className="text-xs font-extrabold uppercase tracking-wider text-brand-ink">
                  Lección {position} de {total}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={onClose}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface-raised"
              >
                <Text className="text-base font-bold text-ink-soft">✕</Text>
              </Pressable>
            </View>

            <View className="items-center py-2">
              <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
                <IconMusicNote size={42} color={colors.brandInk} filled />
              </View>
              <Text className="mb-5 text-center text-xl font-extrabold text-ink">{lesson.title}</Text>

              <View className="mb-6 flex-row items-center gap-1.5 rounded-2xl bg-surface-sunken px-4 py-2.5">
                <IconBolt size={18} color="#F4BF00" filled />
                <Text className="text-[15px] font-bold text-ink">+{lesson.xpReward} XP</Text>
              </View>

              <TactileButton
                label={review ? 'Repasar' : `Comenzar (+${lesson.xpReward} XP)`}
                height={52}
                lip={5}
                color={GAME_COLORS.green.fill}
                lipColor={GAME_COLORS.green.lip}
                textClassName="text-lg"
                className="w-full"
                onPress={() => onStart(lesson)}
              />
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}
