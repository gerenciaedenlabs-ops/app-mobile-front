import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { IconCrown, IconLock, IconMusicNote, IconPlay, IconStar } from '@/components/icons';
import { useBounce, useLoop } from '@/hooks/useLoopAnimation';
import { cn } from '@/lib/cn';
import { GAME_COLORS } from '@/lib/theme';
import { useThemeColors } from '@/store/themeStore';
import type { Lesson, LessonState } from '@/types/content';

/** Diámetro del nodo activo; los demás son 64. */
export const ACTIVE_NODE_SIZE = 80;
const NODE_SIZE = 64;
const EMPIEZA_PURPLE = '#854CE6';

/** Onda verde que se expande y desvanece alrededor del nodo activo. */
function Ripple({ delay, size }: { delay: number; size: number }) {
  const progress = useLoop((value) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, {
        toValue: 1,
        duration: 2200,
        easing: Easing.bezier(0.24, 0, 0.38, 1),
        useNativeDriver: true,
      }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]),
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: GAME_COLORS.green.fill,
        opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.35, 0, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.4] }) }],
      }}
    />
  );
}

/** Burbuja "¡EMPIEZA!" que va sobre el nodo activo. */
export function StartBubble() {
  const colors = useThemeColors();
  const translateY = useBounce(6, 1000);

  return (
    <Animated.View style={{ transform: [{ translateY }] }} className="mb-2 items-center">
      <View className="flex-row items-center gap-1 rounded-full border border-line border-b-4 bg-surface px-3.5 py-1">
        <Text style={{ color: EMPIEZA_PURPLE }} className="text-xs font-extrabold uppercase tracking-wider">
          ¡Empieza!
        </Text>
        <IconPlay size={13} color={EMPIEZA_PURPLE} filled strokeWidth={2.4} />
      </View>
      <View
        style={{ backgroundColor: colors.surface, borderColor: colors.line }}
        className="-mt-1.5 h-3 w-3 rotate-45 border-b border-r"
      />
    </Animated.View>
  );
}

interface PathNodeProps {
  lesson: Lesson;
  state: LessonState;
  onPress: () => void;
}

export function PathNode({ lesson, state, onPress }: PathNodeProps) {
  const colors = useThemeColors();
  const available = state === 'available';
  const locked = state === 'locked';
  const size = available ? ACTIVE_NODE_SIZE : NODE_SIZE;
  const lip = available ? 6 : 5;

  const fill = available ? GAME_COLORS.green.fill : locked ? colors.surfaceRaised : GAME_COLORS.gold.fill;
  const lipColor = available ? GAME_COLORS.green.lip : locked ? colors.line : GAME_COLORS.gold.lip;

  return (
    <View className="items-center">
      <View style={{ width: ACTIVE_NODE_SIZE, height: ACTIVE_NODE_SIZE + 6 }} className="items-center justify-center">
        {available ? (
          <>
            <Ripple delay={0} size={96} />
            <Ripple delay={700} size={112} />
          </>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lesson.title}
          accessibilityHint={
            locked ? 'Bloqueada. Completa la lección anterior.' : available ? 'Empezar' : 'Completada. Repasar.'
          }
          accessibilityState={{ disabled: locked }}
          disabled={locked}
          onPress={onPress}
          style={({ pressed }) => ({
            width: size,
            height: size + lip,
            borderRadius: size / 2,
            backgroundColor: lipColor,
            paddingBottom: pressed ? 1 : lip,
            marginTop: pressed ? lip - 1 : 0,
          })}
        >
          <View
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fill }}
            className="items-center justify-center"
          >
            {locked ? (
              <IconLock size={26} color={colors.inkMuted} strokeWidth={2.2} />
            ) : available ? (
              <IconMusicNote size={36} color="#FFFFFF" filled strokeWidth={2.2} />
            ) : (
              <IconStar size={30} color="#FFFFFF" filled strokeWidth={2.2} />
            )}
          </View>
        </Pressable>

        {lesson.isPremium ? (
          <View className="absolute right-0 top-0 h-6 w-6 items-center justify-center rounded-full bg-[#FEC700]">
            <IconCrown size={14} color="#6E5400" filled />
          </View>
        ) : null}
      </View>

      <View
        className={cn(
          'mt-2.5 max-w-[160px] rounded-xl border border-line border-b-4 bg-surface',
          available ? 'px-3.5 py-1.5' : 'px-3 py-1',
        )}
      >
        <Text
          numberOfLines={2}
          className={cn(
            'text-center',
            available ? 'text-[13px] font-bold text-ink' : 'text-[11px] font-bold text-ink-soft',
          )}
        >
          {lesson.title}
        </Text>
      </View>
    </View>
  );
}

