import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { AudioLevelBar } from '@/components/development/AudioLevelBar';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { centsFrom, noteToFrequency } from '@/lib/pitch';

const NOTE_NAMES: Record<string, string> = {
  C: 'DO', 'C#': 'DO♯', D: 'RE', 'D#': 'RE♯', E: 'MI', F: 'FA',
  'F#': 'FA♯', G: 'SOL', 'G#': 'SOL♯', A: 'LA', 'A#': 'LA♯', B: 'SI',
};

export default function GuitarTunerScreen() {
  const [enabled, setEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const target = useMemo(() => ({ name: 'A', octave: 4, frequencyHz: 440 }), []);
  const detector = usePitchDetector({
    target,
    centsTolerance: 25,
    evaluationDurationMs: null,
    enabled,
    minFrequencyHz: 70,
    maxFrequencyHz: 1400,
    onInputLevel: setInputLevel,
  });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  const nearestFrequency = detector.pitch
    ? noteToFrequency(detector.pitch.noteName, detector.pitch.octave)
    : null;
  const nearestCents = detector.pitch && nearestFrequency
    ? Math.round(centsFrom(detector.pitch.frequencyHz, nearestFrequency))
    : null;

  return (
    <Screen scroll>
      <DevelopmentHeader title="Detector de guitarra" subtitle="Notas individuales en tiempo real" />
      <View className="mt-6 rounded-3xl bg-white p-6">
        <AudioLevelBar level={inputLevel} />
        <View className="mt-7 items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-ink-muted">Nota detectada</Text>
          <Text className="mt-2 text-6xl font-black text-violet-700">
            {detector.pitch ? NOTE_NAMES[detector.pitch.noteName] ?? detector.pitch.noteName : '—'}
          </Text>
          <Text className="mt-1 text-xl font-bold text-ink">
            {detector.pitch?.label ?? 'Toca una sola cuerda'}
          </Text>
          <Text className="mt-5 text-3xl font-extrabold text-ink">
            {detector.pitch ? `${detector.pitch.frequencyHz.toFixed(1)} Hz` : '0.0 Hz'}
          </Text>
          <Text className={`mt-2 text-base font-bold ${nearestCents !== null && Math.abs(nearestCents) <= 25 ? 'text-success' : 'text-warning'}`}>
            {nearestCents === null
              ? 'Esperando señal estable'
              : nearestCents === 0
                ? 'Afinación exacta'
                : `${nearestCents > 0 ? '+' : ''}${nearestCents} cents`}
          </Text>
        </View>
        {detector.error ? <Text className="mt-4 text-center text-sm font-semibold text-danger">{detector.error}</Text> : null}
        <Button
          label={enabled ? 'Detener detector' : 'Escuchar guitarra'}
          variant={enabled ? 'secondary' : 'primary'}
          onPress={() => setEnabled((value) => !value)}
          className="mt-7"
        />
      </View>
      <Text className="mt-4 text-xs leading-5 text-ink-muted">
        Motor YIN monofónico: toca una cuerda a la vez y evita que suenen otras cuerdas.
      </Text>
    </Screen>
  );
}

