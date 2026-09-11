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
const OFFSET_PATTERN = [0, 64, 38, -38, -64, 0];

export function UnitSection({ tree, accentColor, onSelectLesson }: UnitSectionProps) {
  const total = tree.nodes.length;

  return (
    <View className="mb-4">
      <View
        style={{ backgroundColor: tree.locked ? '#E2E8F0' : accentColor }}
        className="mb-8 rounded-2xl px-4 py-4"
      >
        <Text
          className={cn(
            'text-xs font-bold uppercase tracking-wider',
            tree.locked ? 'text-ink-muted' : 'text-white/80',
          )}
        >
          ETAPA 1 · UNIDAD {tree.unit.order} · {tree.completedCount}/{total}
        </Text>
        <Text className={cn('mt-1 text-lg font-extrabold', tree.locked ? 'text-ink-soft' : 'text-white')}>
          {tree.unit.title}
        </Text>
        {tree.locked ? (
          <Text className="mt-0.5 text-xs text-ink-muted">
            Termina la unidad anterior para desbloquearla
          </Text>
        ) : null}
      </View>

      <View className="items-center pb-3">
        {tree.nodes.map((node, index) => (
          <View key={node.lesson.id} className="items-center">
            {index > 0 ? <View className="h-7 w-0.5 bg-slate-200" /> : null}
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
