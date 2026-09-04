import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import type { UnitTreeState } from '@/lib/unlock';
import type { Lesson } from '@/types/content';

import { LessonNode } from './LessonNode';

interface UnitSectionProps {
  tree: UnitTreeState;
  accentColor: string;
  onSelectLesson: (lesson: Lesson) => void;
}

/** Zigzag tipo Duolingo: el patrón se repite cada 4 nodos. */
const OFFSET_PATTERN = [0, 56, 0, -56];

export function UnitSection({ tree, accentColor, onSelectLesson }: UnitSectionProps) {
  const total = tree.nodes.length;

  return (
    <View className="mb-2">
      <View
        style={{ backgroundColor: tree.locked ? '#E2E8F0' : accentColor }}
        className="mb-6 rounded-2xl px-4 py-3"
      >
        <Text
          className={cn(
            'text-xs font-bold uppercase tracking-wider',
            tree.locked ? 'text-ink-muted' : 'text-white/80',
          )}
        >
          Unidad {tree.unit.order} · {tree.completedCount}/{total}
        </Text>
        <Text className={cn('text-lg font-extrabold', tree.locked ? 'text-ink-soft' : 'text-white')}>
          {tree.unit.title}
        </Text>
        {tree.locked ? (
          <Text className="mt-0.5 text-xs text-ink-muted">
            Termina la unidad anterior para desbloquearla
          </Text>
        ) : null}
      </View>

      <View className="items-center">
        {tree.nodes.map((node, index) => (
          <View key={node.lesson.id} className="items-center">
            {index > 0 ? <View className="h-6 w-1 rounded-full bg-slate-200" /> : null}
            <LessonNode
              lesson={node.lesson}
              state={node.state}
              accentColor={accentColor}
              offset={OFFSET_PATTERN[index % OFFSET_PATTERN.length] ?? 0}
              onPress={() => onSelectLesson(node.lesson)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
