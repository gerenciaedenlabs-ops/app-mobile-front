import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { cn } from '@/lib/cn';
import { noteToFrequency } from '@/lib/pitch';

const TARGET = {
  name: 'G',
  displayName: 'SOL',
  octave: 4,
  frequencyHz: noteToFrequency('G', 4) ?? 391.995,
};
const CENTS_TOLERANCE = 25;
const HOLD_MS = 1000;
const ATTEMPT_TIMEOUT_MS = 10_000;

type LevelState = 'ready' | 'listening' | 'passed' | 'failed';

const NOTE_NAMES_ES: Record<string, string> = {
  C: 'DO',
  'C#': 'DO♯',
  D: 'RE',
  'D#': 'RE♯',
  E: 'MI',
  F: 'FA',
  'F#': 'FA♯',
  G: 'SOL',
  'G#': 'SOL♯',
  A: 'LA',
  'A#': 'LA♯',
  B: 'SI',
};

function MicrophoneLevel({ level, active }: { level: Animated.Value; active: boolean }) {
  const pulseScale = level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.38] });
  const pulseOpacity = level.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.46] });
  const barScale = level.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] });

  return (
    <View className="mt-5 items-center">
      <View className="h-24 w-24 items-center justify-center">
        <Animated.View
          style={{
            opacity: active ? pulseOpacity : 0.08,
            transform: [{ scale: active ? pulseScale : 1 }],
          }}
          className="absolute h-20 w-20 rounded-full bg-cyan-500"
        />
        <View
          className={cn(
            'h-16 w-16 items-center justify-center rounded-full border-2 bg-white',
            active ? 'border-cyan-500' : 'border-slate-200',
          )}
        >
          <Text className="text-3xl">🎤</Text>
        </View>
      </View>
      <View className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
        <Animated.View
          style={{ transform: [{ scaleX: active ? barScale : 0.04 }] }}
          className={cn('h-full w-full rounded-full', active ? 'bg-cyan-500' : 'bg-slate-300')}
        />
      </View>
      <Text className="mt-2 text-xs font-semibold text-ink-muted">
        {active ? 'Micrófono activo' : 'Micrófono en espera'}
      </Text>
    </View>
  );
}

function TunerNeedle({ cents, visible, inTune }: { cents: number; visible: boolean; inTune: boolean }) {
  const position = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.timing(position, {
      toValue: Math.max(-1, Math.min(1, cents / 50)),
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [cents, position]);

  const translateX = position.interpolate({
    inputRange: [-1, 1],
    outputRange: [-trackWidth * 0.45, trackWidth * 0.45],
  });

  return (
    <View
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      className="h-16 justify-center rounded-2xl bg-surface-sunken px-4"
    >
      <View className="h-1 w-full rounded-full bg-slate-200" />
      <View className="absolute left-1/2 h-10 w-0.5 bg-slate-400" />
      <Animated.View
        style={{
          left: '50%',
          opacity: visible ? 1 : 0,
          transform: [{ translateX }],
        }}
        className={cn('absolute h-10 w-1.5 rounded-full', inTune ? 'bg-success' : 'bg-danger')}
      />
    </View>
  );
}

export default function VoicePitchTestScreen() {
  const router = useRouter();
  const [levelState, setLevelState] = useState<LevelState>('ready');
  const microphoneLevel = useRef(new Animated.Value(0)).current;

  const handleAchieved = useCallback(() => setLevelState('passed'), []);
  const handleInputLevel = useCallback(
    (level: number) => {
      Animated.timing(microphoneLevel, {
        toValue: level,
        duration: 160,
        useNativeDriver: true,
      }).start();
    },
    [microphoneLevel],
  );
  const detector = usePitchDetector({
    target: TARGET,
    centsTolerance: CENTS_TOLERANCE,
    holdMs: HOLD_MS,
    enabled: levelState === 'listening',
    minFrequencyHz: 70,
    maxFrequencyHz: 1100,
    onInputLevel: handleInputLevel,
    onAchieved: handleAchieved,
  });

  useEffect(() => {
    if (levelState !== 'listening' || detector.status !== 'listening') return;
    const timeout = setTimeout(() => setLevelState('failed'), ATTEMPT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [levelState, detector.status]);

  const startAttempt = () => {
    detector.restart();
    setLevelState('listening');
  };

  const stopAttempt = () => {
    detector.stop();
    setLevelState('ready');
  };

  const cents = detector.pitch?.cents ?? 0;
  const detectedName = detector.pitch
    ? `${NOTE_NAMES_ES[detector.pitch.noteName] ?? detector.pitch.noteName} (${detector.pitch.label})`
    : '—';
  const isListening = levelState === 'listening';

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
          <Text className="text-xs font-extrabold text-cyan-700">PRUEBA · AFINACIÓN</Text>
        </View>
      </View>

      <Text className="mt-5 text-3xl font-extrabold text-ink">Canta {TARGET.displayName}</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">
        Mantén la nota durante 1 segundo. Una variación de hasta ±{CENTS_TOLERANCE} cents cuenta como afinada.
      </Text>

      <MicrophoneLevel
        level={microphoneLevel}
        active={isListening && detector.status === 'listening'}
      />

      <View className="mt-5 rounded-3xl bg-white p-5">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-surface-sunken p-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Objetivo</Text>
            <Text className="mt-2 text-3xl font-extrabold text-cyan-700">{TARGET.displayName}</Text>
            <Text className="mt-1 text-sm text-ink-muted">G4 · {TARGET.frequencyHz.toFixed(1)} Hz</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface-sunken p-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Detectada</Text>
            <Text className="mt-2 text-2xl font-extrabold text-ink">{detectedName}</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              {detector.pitch ? `${detector.pitch.frequencyHz.toFixed(1)} Hz` : 'Esperando tu voz'}
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <TunerNeedle
            cents={cents}
            visible={detector.pitch !== null}
            inTune={detector.match.inTune}
          />
        </View>

        <View className="mt-3 flex-row justify-between">
          <Text className="text-xs text-ink-muted">Grave</Text>
          <Text
            className={cn(
              'text-sm font-extrabold',
              detector.pitch
                ? detector.match.inTune
                  ? 'text-success'
                  : 'text-danger'
                : 'text-ink-muted',
            )}
          >
            {detector.pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : '—'}
          </Text>
          <Text className="text-xs text-ink-muted">Agudo</Text>
        </View>

        <View className="mt-6">
          <ProgressBar
            value={detector.match.progress}
            label="Tiempo manteniendo SOL afinado"
            fillClassName={detector.match.inTune ? 'bg-success' : 'bg-cyan-600'}
          />
        </View>
      </View>

      <View className="mt-5 min-h-[116px] items-center justify-center rounded-3xl bg-white p-5">
        {levelState === 'passed' ? (
          <>
            <Text className="text-xl font-extrabold text-success">✅ NIVEL SUPERADO</Text>
            <Text className="mt-2 text-center text-sm text-ink-muted">Has cantado SOL correctamente.</Text>
          </>
        ) : levelState === 'failed' ? (
          <>
            <Text className="text-xl font-extrabold text-danger">❌ INTÉNTALO DE NUEVO</Text>
            <Text className="mt-2 text-center text-sm text-ink-muted">
              Estuviste cerca, pero la nota no está suficientemente afinada.
            </Text>
          </>
        ) : detector.error ? (
          <Text className="text-center text-sm font-semibold text-danger">{detector.error}</Text>
        ) : (
          <Text className="text-center text-sm text-ink-muted">
            {isListening
              ? detector.status === 'requesting_permission'
                ? 'Solicitando acceso al micrófono…'
                : detector.pitch
                  ? detector.match.inTune
                    ? '¡Bien! Sigue manteniendo la nota.'
                    : 'Ajusta tu voz hacia el centro.'
                  : 'Escuchando… canta SOL con una voz sostenida.'
              : 'Busca un lugar tranquilo y pulsa Empezar prueba.'}
          </Text>
        )}
      </View>

      {isListening ? (
        <Button label="Detener" variant="ghost" onPress={stopAttempt} className="mt-5" />
      ) : (
        <Button
          label={levelState === 'ready' ? 'Empezar prueba' : 'Intentar de nuevo'}
          icon="🎤"
          onPress={startAttempt}
          className="mt-5"
        />
      )}
    </Screen>
  );
}
