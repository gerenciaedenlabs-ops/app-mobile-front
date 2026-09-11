import { Redirect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import {
  MicrophoneLevel,
  NOTE_NAMES_ES,
  TunerNeedle,
} from '@/features/voice/VoicePitchChallenge';
import { type DetectedPitch, type PitchTargetMatch, usePitchDetector } from '@/hooks/usePitchDetector';
import { cn } from '@/lib/cn';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { formatNote, noteToFrequency } from '@/lib/pitch';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const OCTAVES = [2, 3, 4, 5] as const;
const CENTS_TOLERANCE = 25;

export default function VoiceTunerScreen() {
  const router = useRouter();
  const [selectedNote, setSelectedNote] = useState<(typeof NOTES)[number]>('G');
  const [selectedOctave, setSelectedOctave] = useState<(typeof OCTAVES)[number]>(4);
  const [listening, setListening] = useState(false);
  const microphoneLevel = useRef(new Animated.Value(0)).current;
  const liveNeedlePosition = useRef(new Animated.Value(0)).current;
  const liveNeedleOpacity = useRef(new Animated.Value(0)).current;
  const liveTune = useRef(new Animated.Value(0)).current;
  const frequencyRef = useRef<TextInput>(null);
  const detectedNoteRef = useRef<TextInput>(null);
  const centsRef = useRef<TextInput>(null);
  const guidanceRef = useRef<TextInput>(null);

  const target = useMemo(
    () => ({
      name: selectedNote,
      octave: selectedOctave,
      frequencyHz: noteToFrequency(selectedNote, selectedOctave) ?? 391.995,
    }),
    [selectedNote, selectedOctave],
  );

  const handleInputLevel = useCallback(
    (level: number) => {
      Animated.timing(microphoneLevel, {
        toValue: level,
        duration: 90,
        useNativeDriver: true,
      }).start();
    },
    [microphoneLevel],
  );

  const handleLivePitch = useCallback(
    (pitch: DetectedPitch | null) => {
      frequencyRef.current?.setNativeProps({ text: pitch ? pitch.frequencyHz.toFixed(1) : '--.-' });
      detectedNoteRef.current?.setNativeProps({
        text: pitch ? `${NOTE_NAMES_ES[pitch.noteName] ?? pitch.noteName} · ${pitch.label}` : '—',
      });
      centsRef.current?.setNativeProps({ text: pitch ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} cents` : '—' });
      liveNeedleOpacity.setValue(pitch ? 1 : 0);
      if (pitch) liveNeedlePosition.setValue(Math.max(-1, Math.min(1, pitch.cents / 50)));
    },
    [liveNeedleOpacity, liveNeedlePosition],
  );

  const handleLiveMatch = useCallback(
    (match: PitchTargetMatch) => {
      liveTune.setValue(match.inTune ? 1 : 0);
      guidanceRef.current?.setNativeProps({
        text: match.inTune
          ? `Afinada dentro de ±${CENTS_TOLERANCE} cents`
          : 'Sigue ajustando hasta llevar la aguja al centro',
      });
    },
    [liveTune],
  );

  const detector = usePitchDetector({
    target,
    centsTolerance: CENTS_TOLERANCE,
    evaluationDurationMs: null,
    enabled: listening,
    minFrequencyHz: 70,
    maxFrequencyHz: 1100,
    onInputLevel: handleInputLevel,
    onPitch: handleLivePitch,
    onMatch: handleLiveMatch,
  });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  const cents = detector.pitch?.cents ?? 0;

  const toggleListening = () => {
    if (listening) {
      detector.stop();
      guidanceRef.current?.setNativeProps({ text: 'Activa el micrófono para comenzar' });
    } else {
      detector.restart();
      guidanceRef.current?.setNativeProps({ text: 'Escuchando tu voz…' });
    }
    setListening((current) => !current);
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-slate-200"
        >
          <Text className="text-2xl text-ink">‹</Text>
        </Pressable>
        <View className="rounded-full bg-cyan-100 px-3 py-1">
          <Text className="text-xs font-extrabold text-cyan-700">DEBUG · AFINADOR LIBRE</Text>
        </View>
      </View>

      <Text className="mt-5 text-3xl font-extrabold text-ink">Afina tu voz</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">
        Elige una nota y ajusta tu voz mirando la frecuencia y la aguja. Esta herramienta no termina ni califica.
      </Text>

      <Text className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-muted">
        Nota objetivo
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {NOTES.map((note) => {
          const selected = note === selectedNote;
          return (
            <Pressable
              key={note}
              accessibilityRole="button"
              accessibilityLabel={`${NOTE_NAMES_ES[note] ?? note} 4`}
              accessibilityState={{ selected }}
              onPress={() => setSelectedNote(note)}
              className={cn(
                'min-w-[52px] items-center rounded-xl border-2 px-3 py-2.5',
                selected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-200 bg-white',
              )}
            >
              <Text className={cn('text-sm font-extrabold', selected ? 'text-white' : 'text-ink')}>
                {NOTE_NAMES_ES[note] ?? note}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-muted">Octava</Text>
      <View className="mt-2 flex-row gap-2">
        {OCTAVES.map((octave) => {
          const selected = octave === selectedOctave;
          return (
            <Pressable
              key={octave}
              accessibilityRole="button"
              accessibilityLabel={`Octava ${octave}`}
              accessibilityState={{ selected }}
              onPress={() => setSelectedOctave(octave)}
              className={cn(
                'h-11 flex-1 items-center justify-center rounded-xl border-2',
                selected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-200 bg-white',
              )}
            >
              <Text className={cn('font-extrabold', selected ? 'text-white' : 'text-ink')}>{octave}</Text>
            </Pressable>
          );
        })}
      </View>

      <MicrophoneLevel level={microphoneLevel} active={listening && detector.status === 'listening'} />

      <View className="mt-4 rounded-3xl bg-white p-5">
        <View className="items-center">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Frecuencia en vivo</Text>
          <TextInput
            ref={frequencyRef}
            editable={false}
            defaultValue="--.-"
            className="mt-1 p-0 text-center text-5xl font-extrabold tabular-nums text-cyan-700"
          />
          <Text className="text-base font-bold text-cyan-700">Hz</Text>
          <TextInput
            ref={detectedNoteRef}
            editable={false}
            defaultValue="—"
            className="mt-2 p-0 text-center text-lg font-extrabold text-ink"
          />
        </View>

        <View className="mt-5">
          <TunerNeedle
            cents={cents}
            visible={detector.pitch !== null}
            inTune={detector.match.inTune}
            livePosition={liveNeedlePosition}
            liveOpacity={liveNeedleOpacity}
            liveTune={liveTune}
          />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs text-ink-muted">Grave</Text>
          <TextInput
            ref={centsRef}
            editable={false}
            defaultValue="—"
            className="p-0 text-center text-sm font-extrabold text-ink"
          />
          <Text className="text-xs text-ink-muted">Agudo</Text>
        </View>

        <View className="mt-5 rounded-2xl bg-surface-sunken p-4">
          <Text className="text-center text-sm font-bold text-ink">
            Objetivo: {NOTE_NAMES_ES[selectedNote]} ({formatNote(selectedNote, selectedOctave)}) · {target.frequencyHz.toFixed(1)} Hz
          </Text>
          <TextInput
            ref={guidanceRef}
            editable={false}
            defaultValue={listening ? 'Escuchando tu voz…' : 'Activa el micrófono para comenzar'}
            className="mt-1 p-0 text-center text-xs text-ink-muted"
          />
        </View>
      </View>

      {detector.error ? (
        <Text className="mt-3 text-center text-sm font-semibold text-danger">{detector.error}</Text>
      ) : null}

      <Button
        label={listening ? 'Detener afinador' : 'Activar afinador'}
        icon={listening ? undefined : '🎤'}
        variant={listening ? 'ghost' : 'primary'}
        onPress={toggleListening}
        className="mt-5"
      />
    </Screen>
  );
}
