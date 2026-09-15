import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import type { Lesson, LessonState } from '@/types/content';

interface LessonNodeProps {
  lesson: Lesson;
  state: LessonState;
  accentColor: string;
  /** Desplazamiento horizontal para el zigzag del árbol. */
  offset: number;
  onPress: () => void;
}

/**
 * El backend no manda el tipo de ejercicio a nivel de lección (una lección
 * puede mezclar tipos, y solo se sabe al abrir sus ejercicios), así que el
 * nodo disponible usa un ícono genérico en vez de adivinar el tipo dominante.
 */
function getNodeIcon(state: LessonState): string {
  if (state === 'locked') return '🔒';
  if (state === 'completed') return '⭐';
  return '📝';
}

export function LessonNode({ lesson, state, accentColor, offset, onPress }: LessonNodeProps) {
  const locked = state === 'locked';
  const completed = state === 'completed';

  return (
    <View style={{ transform: [{ translateX: offset }] }} className="items-center">
      {state === 'available' ? (
        <View className="mb-2 rounded-full bg-brand px-3 py-1">
          <Text className="text-[10px] font-extrabold tracking-widest text-white">EMPIEZA</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lesson.title}
        accessibilityHint={
          locked ? 'Bloqueada. Completa la lección anterior.' : completed ? 'Completada. Repasar.' : 'Empezar'
        }
        accessibilityState={{ disabled: locked }}
        disabled={locked}
        onPress={onPress}
        style={locked ? undefined : { backgroundColor: accentColor }}
        className={cn(
          'h-[68px] w-[68px] items-center justify-center rounded-full border-2 active:opacity-80',
          locked && 'bg-slate-300',
          completed ? 'border-white' : locked ? 'border-slate-300' : 'border-brand-strong',
        )}
      >
        <Text className="text-3xl">{getNodeIcon(state)}</Text>
      </Pressable>

      <View className="mt-2 max-w-[140px] flex-row items-center gap-1">
        {lesson.isPremium ? <Text className="text-xs">👑</Text> : null}
        {lesson.requiresMicrophone ? <Text className="text-xs">🎤</Text> : null}
        <Text
          numberOfLines={2}
          className={cn('text-center text-xs font-semibold', locked ? 'text-ink-muted' : 'text-ink')}
        >
          {lesson.title}
        </Text>
      </View>
    </View>
  );
}
