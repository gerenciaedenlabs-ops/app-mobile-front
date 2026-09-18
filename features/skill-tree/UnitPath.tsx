import { useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { IconBook, IconLock } from '@/components/icons';
import { useBounce } from '@/hooks/useLoopAnimation';
import { cn } from '@/lib/cn';
import { GAME_COLORS } from '@/lib/theme';
import type { UnitTreeState } from '@/lib/unlock';
import { useThemeColors } from '@/store/themeStore';
import type { Lesson } from '@/types/content';

import { ACTIVE_NODE_SIZE, PathNode, StartBubble } from './PathNode';
import { PathTrail } from './PathTrail';

/** Alto fijo de cada fila del camino: burbuja + nodo + etiqueta. */
const ROW_HEIGHT = 190;
/** Espacio reservado sobre el nodo para la burbuja "¡EMPIEZA!". */
const BUBBLE_SPACE = 42;
/** Zigzag: centro, derecha, izquierda… (Diseno Nuevo/ruta). */
const OFFSET_PATTERN = [0, 70, -60, 60, -70];
/** Margen mínimo entre un nodo y el borde de la pantalla. */
const EDGE_MARGIN = 64;

function UnitBanner({ tree }: { tree: UnitTreeState }) {
  const colors = useThemeColors();
  const total = tree.nodes.length;
  const subtitle = tree.unit.description ?? `${tree.completedCount} de ${total} lecciones completadas`;

  return (
    <View
      style={{
        backgroundColor: tree.locked ? colors.surfaceRaised : GAME_COLORS.purple.fill,
        borderBottomColor: tree.locked ? colors.line : GAME_COLORS.purple.lip,
      }}
      className="mb-8 flex-row items-center justify-between gap-4 rounded-[26px] border-b-[6px] p-5"
    >
      <View className="min-w-0 flex-1">
        <View
          className={cn(
            'mb-1 self-start rounded-full px-2.5 py-0.5',
            tree.locked ? 'bg-line' : 'bg-[#581C87]/70',
          )}
        >
          <Text
            className={cn(
              'text-xs font-extrabold uppercase tracking-wider',
              tree.locked ? 'text-ink-muted' : 'text-[#F5EBFF]',
            )}
          >
            Etapa 1 · Unidad {tree.unit.order} · {tree.completedCount}/{total}
          </Text>
        </View>
        <Text
          className={cn(
            'mb-1 text-[26px] font-extrabold leading-8',
            tree.locked ? 'text-ink-soft' : 'text-white',
          )}
        >
          {tree.unit.title}
        </Text>
        {tree.locked ? (
          <View className="flex-row items-center gap-1.5">
            <IconLock size={14} color={colors.inkMuted} />
            <Text className="text-[13px] font-medium text-ink-muted">
              Termina la unidad anterior para desbloquearla
            </Text>
          </View>
        ) : (
          <Text className="text-[13px] font-medium text-[#F0E6FF]">{subtitle}</Text>
        )}
      </View>
      {tree.locked ? null : (
        <View className="h-12 w-12 items-center justify-center rounded-2xl border-b-[3px] border-[#4A1570] bg-white/20">
          <IconBook size={26} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

/** Rana con bocadillo que acompaña a la siguiente lección. */
function MascotHint({ side }: { side: 'left' | 'right' }) {
  const translateY = useBounce(6, 2800);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, [side]: 0, transform: [{ translateY }] }}
      className={cn('z-20', side === 'left' ? 'items-start' : 'items-end')}
    >
      <View className="mb-1.5 max-w-[140px] rounded-2xl border border-line border-b-4 bg-surface px-3 py-1.5">
        <Text className="text-[11px] font-extrabold leading-tight text-brand-ink">
          ¡Toca tu siguiente lección! 🎵
        </Text>
      </View>
      <Image
        source={require('@/assets/brand/mascot.png')}
        accessibilityIgnoresInvertColors
        style={{ width: 64, height: 65 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

interface UnitPathProps {
  tree: UnitTreeState;
  onSelectLesson: (lesson: Lesson) => void;
}

/** Una unidad del camino: banner, nodos en zigzag y carril que los une. */
export function UnitPath({ tree, onSelectLesson }: UnitPathProps) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);

  const maxOffset = Math.max(0, width / 2 - EDGE_MARGIN);
  const offsets = tree.nodes.map((_, index) => {
    const raw = OFFSET_PATTERN[index % OFFSET_PATTERN.length] ?? 0;
    return Math.max(-maxOffset, Math.min(maxOffset, raw));
  });
  const nodeCenterY = BUBBLE_SPACE + (ACTIVE_NODE_SIZE + 6) / 2;
  const points = offsets.map((offset, index) => ({
    x: width / 2 + offset,
    y: index * ROW_HEIGHT + nodeCenterY,
  }));
  const activeIndex = tree.nodes.findIndex((node) => node.state === 'available');

  return (
    <View className="mb-6">
      <UnitBanner tree={tree} />

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <PathTrail
          width={width}
          height={tree.nodes.length * ROW_HEIGHT}
          points={points}
          completedSegments={tree.completedCount}
          trackColor={colors.line}
          doneColor={GAME_COLORS.green.fill}
        />

        {tree.nodes.map((node, index) => {
          const offset = offsets[index] ?? 0;
          const isActive = index === activeIndex;

          return (
            <View key={node.lesson.id} style={{ height: ROW_HEIGHT }}>
              {isActive ? <MascotHint side={offset >= 0 ? 'left' : 'right'} /> : null}
              <View style={{ transform: [{ translateX: offset }] }} className="items-center">
                <View style={{ height: BUBBLE_SPACE }} className="justify-end">
                  {isActive ? <StartBubble /> : null}
                </View>
                <PathNode
                  lesson={node.lesson}
                  state={node.state}
                  onPress={() => onSelectLesson(node.lesson)}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
