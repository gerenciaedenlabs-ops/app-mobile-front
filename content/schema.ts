/**
 * Validación del contenido local.
 *
 * El JSON entra como `unknown` y sale tipado. Si algo no cuadra se lanza un
 * error con la ruta exacta del campo: es un bug de contenido y debe fallar
 * ruidosamente al arrancar, no silenciarse en una pantalla a medio pintar.
 */
import { INSTRUMENT_IDS, type Instrument, type Lesson, type Unit } from '@/types/content';
import {
  EXERCISE_TYPES,
  type Choice,
  type ChordTarget,
  type Exercise,
  type ExerciseType,
  type NoteTarget,
} from '@/types/exercise';

export class ContentValidationError extends Error {
  constructor(path: string, message: string) {
    super(`[content] ${path}: ${message}`);
    this.name = 'ContentValidationError';
  }
}

function fail(path: string, message: string): never {
  throw new ContentValidationError(path, message);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, `se esperaba un objeto, llegó ${Array.isArray(value) ? 'array' : typeof value}`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, `se esperaba un array, llegó ${typeof value}`);
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(path, 'se esperaba un string no vacío');
  return value;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'se esperaba un número finito');
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'se esperaba un booleano');
  return value;
}

function asOptionalString(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : asString(value, path);
}

function asOneOf<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  const raw = asString(value, path);
  const match = allowed.find((candidate) => candidate === raw);
  if (match === undefined) fail(path, `"${raw}" no está en [${allowed.join(', ')}]`);
  return match;
}

function parseChoice(value: unknown, path: string): Choice {
  const raw = asRecord(value, path);
  return {
    id: asString(raw.id, `${path}.id`),
    label: asString(raw.label, `${path}.label`),
    ...(raw.sublabel === undefined ? {} : { sublabel: asString(raw.sublabel, `${path}.sublabel`) }),
  };
}

function parseChoices(value: unknown, path: string, correctChoiceId: string): Choice[] {
  const choices = asArray(value, path).map((choice, index) => parseChoice(choice, `${path}[${index}]`));
  if (choices.length < 2) fail(path, 'se necesitan al menos 2 opciones');
  if (!choices.some((choice) => choice.id === correctChoiceId)) {
    fail(path, `correctChoiceId "${correctChoiceId}" no coincide con ninguna opción`);
  }
  return choices;
}

function parseTarget(value: unknown, path: string): NoteTarget | ChordTarget {
  const raw = asRecord(value, path);
  const kind = asOneOf(raw.kind, `${path}.kind`, ['note', 'chord'] as const);

  if (kind === 'note') {
    return {
      kind: 'note',
      name: asString(raw.name, `${path}.name`),
      octave: asNumber(raw.octave, `${path}.octave`),
      frequencyHz: asNumber(raw.frequencyHz, `${path}.frequencyHz`),
      ...(raw.string === undefined ? {} : { string: asNumber(raw.string, `${path}.string`) }),
      ...(raw.fret === undefined ? {} : { fret: asNumber(raw.fret, `${path}.fret`) }),
    };
  }

  const diagram = asArray(raw.diagram, `${path}.diagram`).map((position, index) => {
    if (position === 'x') return 'x' as const;
    return asNumber(position, `${path}.diagram[${index}]`);
  });
  if (diagram.length !== 6) fail(`${path}.diagram`, 'un diagrama de guitarra necesita 6 posiciones');

  return {
    kind: 'chord',
    name: asString(raw.name, `${path}.name`),
    notes: asArray(raw.notes, `${path}.notes`).map((note, index) =>
      asString(note, `${path}.notes[${index}]`),
    ),
    diagram,
  };
}

function parseExercise(value: unknown, path: string): Exercise {
  const raw = asRecord(value, path);
  const id = asString(raw.id, `${path}.id`);
  const prompt = asString(raw.prompt, `${path}.prompt`);
  const hint = asOptionalString(raw.hint, `${path}.hint`);
  const base = { id, prompt, ...(hint === undefined ? {} : { hint }) };
  const type = asOneOf<ExerciseType>(raw.type, `${path}.type`, EXERCISE_TYPES);

  switch (type) {
    case 'multiple_choice': {
      const correctChoiceId = asString(raw.correctChoiceId, `${path}.correctChoiceId`);
      const explanation = asOptionalString(raw.explanation, `${path}.explanation`);
      return {
        ...base,
        type,
        choices: parseChoices(raw.choices, `${path}.choices`, correctChoiceId),
        correctChoiceId,
        ...(explanation === undefined ? {} : { explanation }),
      };
    }
    case 'listen_and_choose': {
      const correctChoiceId = asString(raw.correctChoiceId, `${path}.correctChoiceId`);
      const explanation = asOptionalString(raw.explanation, `${path}.explanation`);
      const maxReplays = raw.maxReplays === null ? null : asNumber(raw.maxReplays, `${path}.maxReplays`);
      return {
        ...base,
        type,
        audioKey: asString(raw.audioKey, `${path}.audioKey`),
        choices: parseChoices(raw.choices, `${path}.choices`, correctChoiceId),
        correctChoiceId,
        autoPlay: asBoolean(raw.autoPlay, `${path}.autoPlay`),
        maxReplays,
        ...(explanation === undefined ? {} : { explanation }),
      };
    }
    case 'rhythm_tap': {
      const signature = asArray(raw.timeSignature, `${path}.timeSignature`);
      if (signature.length !== 2) fail(`${path}.timeSignature`, 'se esperaban 2 valores');
      const pattern = asArray(raw.pattern, `${path}.pattern`).map((beat, index) =>
        asNumber(beat, `${path}.pattern[${index}]`),
      );
      if (pattern.length === 0) fail(`${path}.pattern`, 'el patrón no puede estar vacío');
      return {
        ...base,
        type,
        bpm: asNumber(raw.bpm, `${path}.bpm`),
        timeSignature: [
          asNumber(signature[0], `${path}.timeSignature[0]`),
          asNumber(signature[1], `${path}.timeSignature[1]`),
        ],
        countInBeats: asNumber(raw.countInBeats, `${path}.countInBeats`),
        pattern,
        toleranceMs: asNumber(raw.toleranceMs, `${path}.toleranceMs`),
        passAccuracy: asNumber(raw.passAccuracy, `${path}.passAccuracy`),
      };
    }
    case 'guitar_detection':
      return {
        ...base,
        type,
        target: parseTarget(raw.target, `${path}.target`),
        holdMs: asNumber(raw.holdMs, `${path}.holdMs`),
        centsTolerance: asNumber(raw.centsTolerance, `${path}.centsTolerance`),
        timeoutMs: asNumber(raw.timeoutMs, `${path}.timeoutMs`),
      };
    case 'voice_pitch': {
      const target = parseTarget(raw.target, `${path}.target`);
      if (target.kind !== 'note') fail(`${path}.target.kind`, 'la voz necesita una nota objetivo');
      return {
        ...base,
        type,
        target,
        evaluationDurationMs: asNumber(raw.evaluationDurationMs, `${path}.evaluationDurationMs`),
        centsTolerance: asNumber(raw.centsTolerance, `${path}.centsTolerance`),
        timeoutMs: asNumber(raw.timeoutMs, `${path}.timeoutMs`),
      };
    }
  }
}

export function parseInstrument(value: unknown, path: string): Instrument {
  const raw = asRecord(value, path);
  return {
    id: asOneOf(raw.id, `${path}.id`, INSTRUMENT_IDS),
    name: asString(raw.name, `${path}.name`),
    icon: asString(raw.icon, `${path}.icon`),
    accentColor: asString(raw.accentColor, `${path}.accentColor`),
    tagline: asString(raw.tagline, `${path}.tagline`),
  };
}

export function parseUnit(value: unknown, path: string): Unit {
  const raw = asRecord(value, path);
  const lessonIds = asArray(raw.lessonIds, `${path}.lessonIds`).map((lessonId, index) =>
    asString(lessonId, `${path}.lessonIds[${index}]`),
  );
  if (lessonIds.length === 0) fail(`${path}.lessonIds`, 'una unidad necesita al menos una lección');

  return {
    id: asString(raw.id, `${path}.id`),
    instrumentId: asOneOf(raw.instrumentId, `${path}.instrumentId`, INSTRUMENT_IDS),
    title: asString(raw.title, `${path}.title`),
    order: asNumber(raw.order, `${path}.order`),
    lessonIds,
  };
}

export function parseLesson(value: unknown, path: string): Lesson {
  const raw = asRecord(value, path);
  const exercises = asArray(raw.exercises, `${path}.exercises`).map((exercise, index) =>
    parseExercise(exercise, `${path}.exercises[${index}]`),
  );
  if (exercises.length === 0) fail(`${path}.exercises`, 'una lección necesita al menos un ejercicio');

  return {
    id: asString(raw.id, `${path}.id`),
    unitId: asString(raw.unitId, `${path}.unitId`),
    title: asString(raw.title, `${path}.title`),
    order: asNumber(raw.order, `${path}.order`),
    xpReward: asNumber(raw.xpReward, `${path}.xpReward`),
    exerciseTypes: asArray(raw.exerciseTypes, `${path}.exerciseTypes`).map((exerciseType, index) =>
      asOneOf<ExerciseType>(exerciseType, `${path}.exerciseTypes[${index}]`, EXERCISE_TYPES),
    ),
    requiresMicrophone: asBoolean(raw.requiresMicrophone, `${path}.requiresMicrophone`),
    isPremium: asBoolean(raw.isPremium, `${path}.isPremium`),
    exercises,
  };
}
