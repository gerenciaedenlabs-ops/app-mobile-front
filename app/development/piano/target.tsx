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

const KEYS = [
  { id: 'c4', label: 'DO4', name: 'C', octave: 4, frequencyHz: 261.63 },
  { id: 'd4', label: 'RE4', name: 'D', octave: 4, frequencyHz: 293.66 },
  { id: 'e4', label: 'MI4', name: 'E', octave: 4, frequencyHz: 329.63 },
  { id: 'f4', label: 'FA4', name: 'F', octave: 4, frequencyHz: 349.23 },
  { id: 'g4', label: 'SOL4', name: 'G', octave: 4, frequencyHz: 392 },
  { id: 'a4', label: 'LA4', name: 'A', octave: 4, frequencyHz: 440 },
  { id: 'b4', label: 'SI4', name: 'B', octave: 4, frequencyHz: 493.88 },
  { id: 'c5', label: 'DO5', name: 'C', octave: 5, frequencyHz: 523.25 },
] as const;

export default function PianoTargetScreen() {
  const [selectedId, setSelectedId] = useState('c4');
  const [enabled, setEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [result, setResult] = useState<PitchEvaluation | null>(null);
  const target = useMemo(() => KEYS.find((key) => key.id === selectedId) ?? KEYS[0], [selectedId]);
  const detector = usePitchDetector({
    target,
    centsTolerance: 25,
    evaluationDurationMs: 1200,
    enabled,
    minFrequencyHz: 100,
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
      <DevelopmentHeader title="Alcanzar una nota" subtitle="Una tecla a la vez · motor YIN" />
      <View className="mt-5 flex-row flex-wrap gap-2">
        {KEYS.map((key) => (
          <Pressable
            key={key.id}
            disabled={enabled}
            onPress={() => setSelectedId(key.id)}
            className={`rounded-full border-2 px-3 py-2 ${selectedId === key.id ? 'border-blue-600 bg-blue-100 dark:bg-blue-900' : 'border-line bg-surface'}`}
          >
            <Text className="text-xs font-extrabold text-ink">{key.label}</Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-5 rounded-3xl bg-surface p-6">
        <Text className="text-center text-sm font-bold uppercase tracking-wider text-ink-muted">Objetivo</Text>
        <Text className="mt-2 text-center text-5xl font-black text-blue-700 dark:text-blue-300">{target.label}</Text>
        <Text className="mt-1 text-center text-sm text-ink-muted">{target.frequencyHz.toFixed(2)} Hz · tolerancia ±25 cents</Text>
        <View className="mt-6"><AudioLevelBar level={inputLevel} /></View>
        <Text className="mt-6 text-center text-3xl font-extrabold text-ink">{detector.pitch?.label ?? '—'}</Text>
        <Text className="mt-1 text-center text-sm font-semibold text-ink-muted">
          {detector.pitch
            ? `${detector.pitch.frequencyHz.toFixed(1)} Hz · ${detector.pitch.cents > 0 ? '+' : ''}${detector.pitch.cents} cents`
            : 'Toca la tecla seleccionada'}
        </Text>
        <View className="mt-6">
          <ProgressBar value={detector.match.progress} />
          <Text className="mt-2 text-center text-xs text-ink-muted">Mantén la nota durante 1,2 segundos</Text>
        </View>
        {result ? (
          <View className={`mt-5 rounded-2xl p-4 ${result.correct ? 'bg-success-soft' : 'bg-red-50 dark:bg-red-950'}`}>
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
