/**
 * Reglas de desbloqueo del árbol.
 *
 * - Una lección se desbloquea si es la primera de su unidad o si la anterior
 *   de esa misma unidad está completa.
 * - Una unidad se desbloquea si TODAS las lecciones de la unidad anterior
 *   están completas. La primera unidad siempre está abierta.
 *
 * Estado derivado: no se persiste nada de esto.
 */
import type { Lesson, LessonState, UnitWithLessons } from '@/types/content';

export interface LessonNodeState {
  lesson: Lesson;
  state: LessonState;
}

export interface UnitTreeState {
  unit: UnitWithLessons['unit'];
  nodes: LessonNodeState[];
  /** true si la unidad anterior no está terminada. */
  locked: boolean;
  completedCount: number;
}

export type CompletedLessonIds = ReadonlySet<string>;

function isUnitComplete(unit: UnitWithLessons, completed: CompletedLessonIds): boolean {
  return unit.lessons.every((lesson) => completed.has(lesson.id));
}

/** Convierte el currículo + progreso en el árbol que pinta la pantalla. */
export function buildTree(
  curriculum: readonly UnitWithLessons[],
  completed: CompletedLessonIds,
): UnitTreeState[] {
  let previousUnitComplete = true;

  return curriculum.map((entry) => {
    const unitLocked = !previousUnitComplete;
    let previousLessonComplete = true;

    const nodes = entry.lessons.map<LessonNodeState>((lesson) => {
      const isCompleted = completed.has(lesson.id);
      const state: LessonState = isCompleted
        ? 'completed'
        : !unitLocked && previousLessonComplete
          ? 'available'
          : 'locked';

      previousLessonComplete = isCompleted;
      return { lesson, state };
    });

    previousUnitComplete = isUnitComplete(entry, completed);

    return {
      unit: entry.unit,
      nodes,
      locked: unitLocked,
      completedCount: nodes.filter((node) => node.state === 'completed').length,
    };
  });
}

export function getLessonState(
  curriculum: readonly UnitWithLessons[],
  completed: CompletedLessonIds,
  lessonId: string,
): LessonState {
  for (const unit of buildTree(curriculum, completed)) {
    const node = unit.nodes.find((candidate) => candidate.lesson.id === lessonId);
    if (node) return node.state;
  }
  return 'locked';
}

/** Primera lección jugable: lo que abre el botón "Continuar". */
export function getNextLesson(
  curriculum: readonly UnitWithLessons[],
  completed: CompletedLessonIds,
): Lesson | null {
  for (const unit of buildTree(curriculum, completed)) {
    const next = unit.nodes.find((node) => node.state === 'available');
    if (next) return next.lesson;
  }
  return null;
}

export function countCompleted(
  curriculum: readonly UnitWithLessons[],
  completed: CompletedLessonIds,
): number {
  return curriculum.reduce(
    (total, entry) => total + entry.lessons.filter((lesson) => completed.has(lesson.id)).length,
    0,
  );
}
