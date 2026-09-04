/**
 * Punto único de acceso al currículo. Todo lo demás lee de aquí y nunca
 * importa un JSON directamente.
 *
 * TODO(backend): cuando el contenido venga de una API, este módulo se
 * convierte en una caché y las firmas de los selectores no cambian.
 */
import type { Instrument, InstrumentId, Lesson, Unit, UnitWithLessons } from '@/types/content';

import instrumentsJson from './instruments.json';
import drumsU1L1 from './lessons/drums-u1-l1.json';
import guitarU1L1 from './lessons/guitar-u1-l1.json';
import guitarU1L2 from './lessons/guitar-u1-l2.json';
import guitarU2L1 from './lessons/guitar-u2-l1.json';
import pianoU1L1 from './lessons/piano-u1-l1.json';
import { ContentValidationError, parseInstrument, parseLesson, parseUnit } from './schema';
import unitsJson from './units.json';

/** Registrar aquí cada archivo nuevo de lección: Metro no hace globbing. */
const LESSON_SOURCES: readonly { file: string; data: unknown }[] = [
  { file: 'lessons/guitar-u1-l1.json', data: guitarU1L1 },
  { file: 'lessons/guitar-u1-l2.json', data: guitarU1L2 },
  { file: 'lessons/guitar-u2-l1.json', data: guitarU2L1 },
  { file: 'lessons/piano-u1-l1.json', data: pianoU1L1 },
  { file: 'lessons/drums-u1-l1.json', data: drumsU1L1 },
];

const instruments: readonly Instrument[] = (instrumentsJson as unknown[]).map((raw, index) =>
  parseInstrument(raw, `instruments.json[${index}]`),
);

const units: readonly Unit[] = (unitsJson as unknown[])
  .map((raw, index) => parseUnit(raw, `units.json[${index}]`))
  .sort((a, b) => a.order - b.order);

const lessonsById: ReadonlyMap<string, Lesson> = new Map(
  LESSON_SOURCES.map(({ file, data }) => {
    const lesson = parseLesson(data, file);
    return [lesson.id, lesson] as const;
  }),
);

/**
 * Coherencia entre archivos: los tipos no pueden comprobar que un `lessonId`
 * de una unidad exista de verdad, así que se verifica al arrancar.
 */
function assertCurriculumIntegrity(): void {
  const unitIds = new Set(units.map((unit) => unit.id));

  for (const unit of units) {
    unit.lessonIds.forEach((lessonId, index) => {
      const lesson = lessonsById.get(lessonId);
      if (!lesson) {
        throw new ContentValidationError(
          `units.json (${unit.id})`,
          `la lección "${lessonId}" no está registrada en LESSON_SOURCES`,
        );
      }
      if (lesson.unitId !== unit.id) {
        throw new ContentValidationError(
          `lesson ${lesson.id}`,
          `declara unitId "${lesson.unitId}" pero está listada en "${unit.id}"`,
        );
      }
      if (lesson.order !== index + 1) {
        throw new ContentValidationError(
          `lesson ${lesson.id}`,
          `order ${lesson.order} no coincide con su posición ${index + 1} en ${unit.id}.lessonIds`,
        );
      }
    });
  }

  for (const lesson of lessonsById.values()) {
    if (!unitIds.has(lesson.unitId)) {
      throw new ContentValidationError(
        `lesson ${lesson.id}`,
        `apunta a la unidad inexistente "${lesson.unitId}"`,
      );
    }
  }
}

assertCurriculumIntegrity();

export function getInstruments(): readonly Instrument[] {
  return instruments;
}

export function getInstrument(instrumentId: string): Instrument | undefined {
  return instruments.find((instrument) => instrument.id === instrumentId);
}

export function getUnitsForInstrument(instrumentId: InstrumentId): Unit[] {
  return units.filter((unit) => unit.instrumentId === instrumentId);
}

export function getLesson(lessonId: string): Lesson | undefined {
  return lessonsById.get(lessonId);
}

/** Unidades del instrumento con sus lecciones ya resueltas y en orden. */
export function getCurriculum(instrumentId: InstrumentId): UnitWithLessons[] {
  return getUnitsForInstrument(instrumentId).map((unit) => ({
    unit,
    // El assert de integridad garantiza que todas existen.
    lessons: unit.lessonIds.map((lessonId) => lessonsById.get(lessonId) as Lesson),
  }));
}

export function getUnit(unitId: string): Unit | undefined {
  return units.find((unit) => unit.id === unitId);
}

/** Cuántas lecciones tiene el instrumento en total (para barras de progreso). */
export function countLessons(instrumentId: InstrumentId): number {
  return getUnitsForInstrument(instrumentId).reduce((total, unit) => total + unit.lessonIds.length, 0);
}
