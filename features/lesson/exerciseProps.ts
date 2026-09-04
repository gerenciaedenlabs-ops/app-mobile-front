import type { Exercise, ExerciseResult } from '@/types/exercise';

/**
 * Contrato común de todo componente de ejercicio.
 *
 * El componente resuelve SU ejercicio y avisa una sola vez con `onResult`.
 * A partir de ahí `result` deja de ser null y el componente debe pasar a modo
 * lectura: el botón "Continuar" y el feedback son responsabilidad del runner.
 */
export interface ExerciseComponentProps<T extends Exercise = Exercise> {
  exercise: T;
  result: ExerciseResult | null;
  onResult: (result: ExerciseResult) => void;
}
