/**
 * Traduce un ejercicio tal cual lo manda el backend (tipos y `data` en
 * español) al tipo local `Exercise` que ya consumen ExerciseRenderer y los
 * componentes existentes, sin tocarlos.
 */
import type { ApiExercise, ApiListenAndChooseData, ApiMultipleChoiceData } from '@/types/api';
import type { Choice, Exercise } from '@/types/exercise';

function toChoices(opciones: readonly string[]): Choice[] {
  return opciones.map((label, index) => ({ id: String(index), label }));
}

export function mapApiExercise(raw: ApiExercise): Exercise {
  switch (raw.type) {
    case 'opcion_multiple': {
      const data = raw.data as ApiMultipleChoiceData;
      return {
        id: raw.id,
        prompt: raw.prompt,
        type: 'multiple_choice',
        choices: toChoices(data.opciones),
        correctChoiceId: String(data.respuestaCorrectaIndice),
      };
    }
    case 'escuchar_y_elegir': {
      const data = raw.data as ApiListenAndChooseData;
      return {
        id: raw.id,
        prompt: raw.prompt,
        type: 'listen_and_choose',
        // audioKey acepta una URL remota directamente (ver lib/audio.ts).
        audioKey: data.urlAudio,
        choices: toChoices(data.opciones),
        correctChoiceId: String(data.respuestaCorrectaIndice),
        autoPlay: true,
        maxReplays: null,
      };
    }
    // ritmo_toque, deteccion_guitarra, emparejar, banco_palabras, dictado: el
    // backend no documenta su `data` todavía. No se adivina su forma.
    default:
      return {
        id: raw.id,
        prompt: raw.prompt,
        type: 'unsupported',
        typeName: raw.typeName,
      };
  }
}
