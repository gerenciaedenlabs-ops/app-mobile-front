/**
 * Ejercicios: unión discriminada por `type`.
 *
 * Regla: cada variante define SOLO los datos que su componente necesita para
 * renderizarse y para evaluarse. Nada de campos opcionales "por si acaso".
 */

export const EXERCISE_TYPES = [
  'multiple_choice',
  'listen_and_choose',
  'rhythm_tap',
  'guitar_detection',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export interface ExerciseBase {
  id: string;
  /** Enunciado que se muestra arriba del ejercicio. */
  prompt: string;
  /** Pista opcional para el usuario cuando falla. */
  hint?: string;
}

export interface Choice {
  id: string;
  label: string;
  /** Texto secundario pequeño (ej. "6ª cuerda", "82.41 Hz"). */
  sublabel?: string;
}

export interface MultipleChoiceExercise extends ExerciseBase {
  type: 'multiple_choice';
  choices: Choice[];
  correctChoiceId: string;
  /** Se muestra tras responder, correcto o no. */
  explanation?: string;
}

export interface ListenAndChooseExercise extends ExerciseBase {
  type: 'listen_and_choose';
  /** Clave del registry de audio (lib/audio.ts), no una ruta de archivo suelta. */
  audioKey: string;
  choices: Choice[];
  correctChoiceId: string;
  autoPlay: boolean;
  /** null = repeticiones ilimitadas. */
  maxReplays: number | null;
  explanation?: string;
}

export interface RhythmTapExercise extends ExerciseBase {
  type: 'rhythm_tap';
  bpm: number;
  /** [pulsos por compás, figura del pulso] — ej. [4, 4]. */
  timeSignature: [number, number];
  /** Pulsos de preparación antes de que empiece a contar el patrón. */
  countInBeats: number;
  /** Offsets en negras desde el beat 0 donde el usuario debe tocar. Ej. [0, 1, 2, 3]. */
  pattern: number[];
  /** Ventana de acierto en ms (±) alrededor del beat objetivo. */
  toleranceMs: number;
  /** Precisión mínima (0..1) para dar el ejercicio por correcto. */
  passAccuracy: number;
}

/** Nota suelta al aire o pisada. */
export interface NoteTarget {
  kind: 'note';
  /** Nombre sin octava: "E", "A", "C#". */
  name: string;
  octave: number;
  frequencyHz: number;
  /** 1 = primera cuerda (mi agudo). Opcional: no toda nota se ancla a un traste. */
  string?: number;
  fret?: number;
}

/** Acorde completo. */
export interface ChordTarget {
  kind: 'chord';
  /** "Em", "G", "Cadd9". */
  name: string;
  /** Notas que lo componen, para feedback parcial. */
  notes: string[];
  /**
   * Diagrama de 6 posiciones, de la 6ª cuerda (mi grave) a la 1ª.
   * Número = traste (0 = al aire), 'x' = cuerda muteada.
   */
  diagram: (number | 'x')[];
}

export interface GuitarDetectionExercise extends ExerciseBase {
  type: 'guitar_detection';
  target: NoteTarget | ChordTarget;
  /** Tiempo que hay que sostener el objetivo afinado para validar. */
  holdMs: number;
  /** Desviación tolerada en cents. */
  centsTolerance: number;
  /** Si se agota, el ejercicio se marca como fallado. */
  timeoutMs: number;
}

export type Exercise =
  | MultipleChoiceExercise
  | ListenAndChooseExercise
  | RhythmTapExercise
  | GuitarDetectionExercise;

/** Resultado de un ejercicio resuelto dentro de una sesión. */
export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  /** 0..1. En rhythm_tap es la precisión real; en el resto, 1 o 0. */
  score: number;
}
