import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import {
  type PitchEvaluation,
  type PitchTarget,
  usePitchDetector,
} from '@/hooks/usePitchDetector';
import { cn } from '@/lib/cn';
import { formatNote } from '@/lib/pitch';

type ChallengeState = 'ready' | 'listening' | 'completed' | 'timed_out';

export interface VoicePitchChallengeResult {
  correct: boolean;
  evaluation: PitchEvaluation | null;
}

interface VoicePitchChallengeProps {
  target: PitchTarget;
  displayName: string;
  prompt: string;
  hint?: string;
  centsTolerance: number;
  evaluationDurationMs: number;
  timeoutMs: number;
  allowRetry?: boolean;
  onResult?: (result: VoicePitchChallengeResult) => void;
}

export const NOTE_NAMES_ES: Record<string, string> = {
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

export function MicrophoneLevel({ level, active }: { level: Animated.Value; active: boolean }) {
  const pulseScale = level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.38] });
  const pulseOpacity = level.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.46] });
  const barScale = level.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] });

  return (
    <View className="mt-4 items-center">
      <View className="h-20 w-20 items-center justify-center">
        <Animated.View
          style={{ opacity: active ? pulseOpacity : 0.08, transform: [{ scale: active ? pulseScale : 1 }] }}
          className="absolute h-16 w-16 rounded-full bg-cyan-500"
        />
        <View
          className={cn(
            'h-14 w-14 items-center justify-center rounded-full border-2 bg-white',
            active ? 'border-cyan-500' : 'border-slate-200',
          )}
        >
          <Text className="text-2xl">🎤</Text>
        </View>
      </View>
      <View className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
        <Animated.View
          style={{ transform: [{ scaleX: active ? barScale : 0.04 }] }}
          className={cn('h-full w-full rounded-full', active ? 'bg-cyan-500' : 'bg-slate-300')}
        />
      </View>
    </View>
  );
}

export function TunerNeedle({ cents, visible, inTune }: { cents: number; visible: boolean; inTune: boolean }) {
  const position = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.timing(position, {
      toValue: Math.max(-1, Math.min(1, cents / 50)),
      duration: 120,
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
      className="h-14 justify-center rounded-2xl bg-surface-sunken px-4"
    >
      <View className="h-1 w-full rounded-full bg-slate-200" />
      <View className="absolute left-1/2 h-9 w-0.5 bg-slate-400" />
      <Animated.View
        style={{ left: '50%', opacity: visible ? 1 : 0, transform: [{ translateX }] }}
        className={cn('absolute h-9 w-1.5 rounded-full', inTune ? 'bg-success' : 'bg-danger')}
      />
    </View>
  );
}

export function VoicePitchChallenge({
  target,
  displayName,
  prompt,
  hint,
  centsTolerance,
  evaluationDurationMs,
  timeoutMs,
  allowRetry = false,
  onResult,
}: VoicePitchChallengeProps) {
  const [challengeState, setChallengeState] = useState<ChallengeState>('ready');
  const microphoneLevel = useRef(new Animated.Value(0)).current;
  const resultSentRef = useRef(false);

  const finish = useCallback(
    (evaluation: PitchEvaluation | null) => {
      if (resultSentRef.current) return;
      resultSentRef.current = true;
      setChallengeState(evaluation ? 'completed' : 'timed_out');
      onResult?.({ correct: evaluation?.correct ?? false, evaluation });
    },
    [onResult],
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

  const detector = usePitchDetector({
    target,
    centsTolerance,
    evaluationDurationMs,
    enabled: challengeState === 'listening',
    minFrequencyHz: 70,
    maxFrequencyHz: 1100,
    onInputLevel: handleInputLevel,
    onEvaluated: finish,
  });

  useEffect(() => {
    if (challengeState !== 'listening' || detector.status !== 'listening') return;
    const timeout = setTimeout(() => finish(null), timeoutMs);
    return () => clearTimeout(timeout);
  }, [challengeState, detector.status, finish, timeoutMs]);

  const start = () => {
    resultSentRef.current = false;
    detector.restart();
    setChallengeState('listening');
  };

  const stop = () => {
    detector.stop();
    resultSentRef.current = false;
    setChallengeState('ready');
  };

  const isListening = challengeState === 'listening';
  const cents = detector.pitch?.cents ?? 0;
  const detectedName = detector.pitch
    ? `${NOTE_NAMES_ES[detector.pitch.noteName] ?? detector.pitch.noteName} (${detector.pitch.label})`
    : '—';
  const finalEvaluation = detector.evaluation;

  return (
    <View className="flex-1">
      <Text className="text-2xl font-extrabold leading-8 text-ink">{prompt}</Text>
      {hint ? <Text className="mt-2 text-sm leading-5 text-ink-muted">{hint}</Text> : null}

      <MicrophoneLevel level={microphoneLevel} active={isListening && detector.status === 'listening'} />

      <View className="mt-4 rounded-3xl bg-white p-4">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-surface-sunken p-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Objetivo</Text>
            <Text className="mt-1 text-3xl font-extrabold text-cyan-700">{displayName}</Text>
            <Text className="mt-1 text-xs text-ink-muted">
              {formatNote(target.name, target.octave)} · {target.frequencyHz.toFixed(1)} Hz
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface-sunken p-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-ink-muted">Detectada</Text>
            <Text className="mt-1 text-xl font-extrabold text-ink">{detectedName}</Text>
            <Text className="mt-1 text-2xl font-extrabold tabular-nums text-cyan-700">
              {detector.pitch ? detector.pitch.frequencyHz.toFixed(1) : '--.-'} Hz
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <TunerNeedle cents={cents} visible={detector.pitch !== null} inTune={detector.match.inTune} />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs text-ink-muted">Grave</Text>
          <Text
            className={cn(
              'text-sm font-extrabold',
              detector.pitch ? (detector.match.inTune ? 'text-success' : 'text-danger') : 'text-ink-muted',
            )}
          >
            {detector.pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : '—'}
          </Text>
          <Text className="text-xs text-ink-muted">Agudo</Text>
        </View>

        <View className="mt-5">
          <ProgressBar
            value={detector.match.progress}
            label="Muestra de voz para evaluación"
            fillClassName="bg-cyan-600"
          />
          <Text className="mt-2 text-center text-xs font-semibold text-ink-muted">
            {detector.match.progress > 0
              ? `Analizando voz · ${Math.round(detector.match.progress * 100)}%`
              : 'La barra comienza cuando detectemos tu voz'}
          </Text>
        </View>
      </View>

      <View className="mt-4 min-h-[92px] items-center justify-center rounded-3xl bg-white p-4">
        {challengeState === 'completed' ? (
          <>
            <Text className={cn('text-lg font-extrabold', finalEvaluation?.correct ? 'text-success' : 'text-danger')}>
              {finalEvaluation?.correct ? '✅ NOTA CORRECTA' : '❌ FUERA DE AFINACIÓN'}
            </Text>
            <Text className="mt-1 text-center text-sm text-ink-muted">
              {finalEvaluation?.sampleCount
                ? `Resultado final: ${finalEvaluation.frequencyHz.toFixed(1)} Hz · ${finalEvaluation.cents > 0 ? '+' : ''}${finalEvaluation.cents} cents.`
                : 'Se detectó sonido, pero no una frecuencia vocal suficientemente estable.'}
            </Text>
          </>
        ) : challengeState === 'timed_out' ? (
          <Text className="text-center text-sm font-semibold text-danger">
            No reunimos suficiente voz continua antes de terminar el tiempo.
          </Text>
        ) : detector.error ? (
          <Text className="text-center text-sm font-semibold text-danger">{detector.error}</Text>
        ) : (
          <Text className="text-center text-sm text-ink-muted">
            {isListening
              ? detector.status === 'requesting_permission'
                ? 'Solicitando acceso al micrófono…'
                : detector.match.progress > 0
                  ? 'Muestra en curso. Sigue cantando mientras se completa la barra.'
                  : `Escuchando… canta ${displayName} con una voz sostenida.`
              : 'Busca un lugar tranquilo y comienza cuando estés listo.'}
          </Text>
        )}
      </View>

      {isListening ? (
        <Button label="Detener" variant="ghost" onPress={stop} className="mt-4" />
      ) : challengeState === 'ready' || allowRetry ? (
        <Button
          label={challengeState === 'ready' ? 'Comenzar' : 'Probar de nuevo'}
          icon="🎤"
          onPress={start}
          className="mt-4"
        />
      ) : null}
    </View>
  );
}
