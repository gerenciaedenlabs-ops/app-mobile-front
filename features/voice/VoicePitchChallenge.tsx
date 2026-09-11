import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import {
  type DetectedPitch,
  type PitchEvaluation,
  type PitchTargetMatch,
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

interface TunerNeedleProps {
  cents: number;
  visible: boolean;
  inTune: boolean;
  livePosition?: Animated.Value;
  liveOpacity?: Animated.Value;
  liveTune?: Animated.Value;
}

export function TunerNeedle({
  cents,
  visible,
  inTune,
  livePosition,
  liveOpacity,
  liveTune,
}: TunerNeedleProps) {
  const fallbackPosition = useRef(new Animated.Value(0)).current;
  const position = livePosition ?? fallbackPosition;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (livePosition) return;
    Animated.timing(fallbackPosition, {
      toValue: Math.max(-1, Math.min(1, cents / 50)),
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [cents, fallbackPosition, livePosition]);

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
        style={{
          left: '50%',
          opacity: liveOpacity ?? (visible ? 1 : 0),
          backgroundColor: liveTune
            ? liveTune.interpolate({ inputRange: [0, 1], outputRange: ['#EF4444', '#22C55E'] })
            : inTune
              ? '#22C55E'
              : '#EF4444',
          transform: [{ translateX }],
        }}
        className="absolute h-9 w-1.5 rounded-full"
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
  const liveNeedlePosition = useRef(new Animated.Value(0)).current;
  const liveNeedleOpacity = useRef(new Animated.Value(0)).current;
  const liveTune = useRef(new Animated.Value(0)).current;
  const liveProgress = useRef(new Animated.Value(0)).current;
  const detectedNoteRef = useRef<TextInput>(null);
  const frequencyRef = useRef<TextInput>(null);
  const centsRef = useRef<TextInput>(null);
  const progressPercentRef = useRef<TextInput>(null);
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

  const handleLivePitch = useCallback(
    (pitch: DetectedPitch | null) => {
      detectedNoteRef.current?.setNativeProps({
        text: pitch ? `${NOTE_NAMES_ES[pitch.noteName] ?? pitch.noteName} (${pitch.label})` : '—',
      });
      frequencyRef.current?.setNativeProps({ text: pitch ? `${pitch.frequencyHz.toFixed(1)} Hz` : '--.- Hz' });
      centsRef.current?.setNativeProps({ text: pitch ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} cents` : '—' });
      liveNeedleOpacity.setValue(pitch ? 1 : 0);
      if (pitch) liveNeedlePosition.setValue(Math.max(-1, Math.min(1, pitch.cents / 50)));
    },
    [liveNeedleOpacity, liveNeedlePosition],
  );

  const handleLiveMatch = useCallback(
    (match: PitchTargetMatch) => {
      liveTune.setValue(match.inTune ? 1 : 0);
      Animated.timing(liveProgress, {
        toValue: match.progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
      progressPercentRef.current?.setNativeProps({ text: `${Math.round(match.progress * 100)}%` });
    },
    [liveProgress, liveTune],
  );

  const detector = usePitchDetector({
    target,
    centsTolerance,
    evaluationDurationMs,
    enabled: challengeState === 'listening',
    minFrequencyHz: 70,
    maxFrequencyHz: 1100,
    onInputLevel: handleInputLevel,
    onPitch: handleLivePitch,
    onMatch: handleLiveMatch,
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
            <TextInput
              ref={detectedNoteRef}
              editable={false}
              defaultValue="—"
              className="mt-1 p-0 text-xl font-extrabold text-ink"
            />
            <TextInput
              ref={frequencyRef}
              editable={false}
              defaultValue="--.- Hz"
              className="mt-1 p-0 text-2xl font-extrabold tabular-nums text-cyan-700"
            />
          </View>
        </View>

        <View className="mt-4">
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

        <View className="mt-5">
          <View className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <Animated.View
              style={{ width: liveProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
              className="h-full rounded-full bg-cyan-600"
            />
          </View>
          <View className="mt-2 flex-row items-center justify-center">
            <Text className="text-xs font-semibold text-ink-muted">Analizando voz · </Text>
            <TextInput
              ref={progressPercentRef}
              editable={false}
              defaultValue="0%"
              className="p-0 text-xs font-extrabold text-ink-muted"
            />
          </View>
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
