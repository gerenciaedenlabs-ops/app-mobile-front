import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { AudioLevelBar } from '@/components/development/AudioLevelBar';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';
import { usePianoDetector } from '@/hooks/usePianoDetector';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const NOTE_NAMES: Record<string, string> = {
  C: 'DO', 'C#': 'DO♯', D: 'RE', 'D#': 'RE♯', E: 'MI', F: 'FA',
  'F#': 'FA♯', G: 'SOL', 'G#': 'SOL♯', A: 'LA', 'A#': 'LA♯', B: 'SI',
};

export default function PianoDetectorScreen() {
  const [enabled, setEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const detector = usePianoDetector({ enabled, onInputLevel: setInputLevel });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  return (
    <Screen scroll>
      <DevelopmentHeader title="Detector de piano" subtitle="Notas y acordes en tiempo real" />
      <View className="mt-6 rounded-3xl bg-white p-6">
        <AudioLevelBar level={inputLevel} />
        <Text className="mt-7 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">
          {detector.notes.length > 1 ? 'Notas detectadas' : 'Nota detectada'}
        </Text>
        {detector.notes.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap justify-center gap-3">
            {detector.notes.map((note) => (
              <View key={note.midi} className="min-w-[92px] rounded-2xl bg-blue-50 px-4 py-3">
                <Text className="text-center text-3xl font-black text-blue-700">{NOTE_NAMES[note.name] ?? note.name}</Text>
                <Text className="mt-1 text-center text-base font-extrabold text-ink">{note.label}</Text>
                <Text className="mt-1 text-center text-xs text-ink-muted">{note.frequencyHz.toFixed(1)} Hz</Text>
                <Text className="mt-1 text-center text-[10px] font-bold text-blue-600">{Math.round(note.confidence * 100)}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="mt-5 items-center py-5">
            <Text className="text-6xl font-black text-blue-200">—</Text>
            <Text className="mt-2 text-sm font-semibold text-ink-muted">Toca una tecla o un acorde</Text>
          </View>
        )}
        {detector.error ? <Text className="mt-4 text-center text-sm font-semibold text-danger">{detector.error}</Text> : null}
        <Button
          label={enabled ? 'Detener detector' : 'Escuchar piano'}
          variant={enabled ? 'secondary' : 'primary'}
          onPress={() => setEnabled((value) => !value)}
          className="mt-7"
        />
      </View>
      <Text className="mt-4 text-xs leading-5 text-ink-muted">
        Motor espectral experimental: reconoce hasta cuatro notas entre C2 y C7. Para acordes más claros, evita ruido ambiente y deja decaer el acorde anterior.
      </Text>
    </Screen>
  );
}
