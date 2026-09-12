import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { AudioLevelBar } from '@/components/development/AudioLevelBar';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';
import { usePitchDetector, type PitchEvaluation } from '@/hooks/usePitchDetector';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const STRINGS = [
  { id: 'e2', label: 'MI 6ª', name: 'E', octave: 2, frequencyHz: 82.41 },
  { id: 'a2', label: 'LA 5ª', name: 'A', octave: 2, frequencyHz: 110 },
  { id: 'd3', label: 'RE 4ª', name: 'D', octave: 3, frequencyHz: 146.83 },
  { id: 'g3', label: 'SOL 3ª', name: 'G', octave: 3, frequencyHz: 196 },
  { id: 'b3', label: 'SI 2ª', name: 'B', octave: 3, frequencyHz: 246.94 },
  { id: 'e4', label: 'MI 1ª', name: 'E', octave: 4, frequencyHz: 329.63 },
] as const;

export default function GuitarTargetScreen() {
  const [selectedId, setSelectedId] = useState('e2');
  const [enabled, setEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [result, setResult] = useState<PitchEvaluation | null>(null);
  const target = useMemo(
    () => STRINGS.find((item) => item.id === selectedId) ?? STRINGS[0],
    [selectedId],
  );
  const detector = usePitchDetector({
    target,
    centsTolerance: 25,
    evaluationDurationMs: 1500,
    enabled,
    minFrequencyHz: 70,
    maxFrequencyHz: 1400,
    onInputLevel: setInputLevel,
    onEvaluated: (evaluation) => {
      setResult(evaluation);
      setEnabled(false);
    },
  });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  const start = () => {
    setResult(null);
    detector.restart();
    setEnabled(true);
  };

  return (
    <Screen scroll>
      <DevelopmentHeader title="Nota objetivo" subtitle="Afinación de cuerdas al aire" />
      <View className="mt-5 flex-row flex-wrap gap-2">
        {STRINGS.map((item) => (
          <Pressable
            key={item.id}
            disabled={enabled}
            onPress={() => setSelectedId(item.id)}
            className={`rounded-full border-2 px-3 py-2 ${selectedId === item.id ? 'border-violet-600 bg-violet-100' : 'border-slate-200 bg-white'}`}
          >
            <Text className="text-xs font-extrabold text-ink">{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-5 rounded-3xl bg-white p-6">
        <Text className="text-center text-sm font-bold uppercase tracking-wider text-ink-muted">Objetivo</Text>
        <Text className="mt-2 text-center text-5xl font-black text-violet-700">{target.label}</Text>
        <Text className="mt-1 text-center text-sm text-ink-muted">{target.frequencyHz.toFixed(2)} Hz · tolerancia ±25 cents</Text>
        <View className="mt-6"><AudioLevelBar level={inputLevel} /></View>
        <Text className="mt-6 text-center text-3xl font-extrabold text-ink">
          {detector.pitch?.label ?? '—'}
        </Text>
        <Text className="mt-1 text-center text-sm font-semibold text-ink-muted">
          {detector.pitch ? `${detector.pitch.frequencyHz.toFixed(1)} Hz · ${detector.pitch.cents > 0 ? '+' : ''}${detector.pitch.cents} cents` : 'Toca la cuerda seleccionada'}
        </Text>
        <View className="mt-6">
          <ProgressBar value={detector.match.progress} />
          <Text className="mt-2 text-center text-xs text-ink-muted">Mantén la nota durante 1,5 segundos</Text>
        </View>
        {result ? (
          <View className={`mt-5 rounded-2xl p-4 ${result.correct ? 'bg-success-soft' : 'bg-red-50'}`}>
            <Text className={`text-center text-lg font-extrabold ${result.correct ? 'text-success' : 'text-danger'}`}>
              {result.correct ? '✅ NOTA SUPERADA' : '❌ INTÉNTALO DE NUEVO'}
            </Text>
          </View>
        ) : null}
        {detector.error ? <Text className="mt-4 text-center text-sm font-semibold text-danger">{detector.error}</Text> : null}
        <Button label={enabled ? 'Escuchando…' : result ? 'Probar otra vez' : 'Comenzar'} disabled={enabled} onPress={start} className="mt-6" />
        {enabled ? <Button label="Detener" variant="ghost" onPress={() => setEnabled(false)} className="mt-2" /> : null}
      </View>
    </Screen>
  );
}
