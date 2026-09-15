import { Redirect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { AudioLevelBar } from '@/components/development/AudioLevelBar';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';
import { type DetectedDrumHit, useDrumDetector } from '@/hooks/useDrumDetector';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { DRUM_LABELS, type DrumHitType } from '@/lib/drumDetection';

const TARGET_BPM = 90;
const BEAT_MS = 60_000 / TARGET_BPM;
const TIMING_TOLERANCE_MS = 190;
const PATTERN: readonly DrumHitType[] = ['kick', 'snare', 'kick', 'snare'];
const FIRST_HIT = PATTERN[0] as DrumHitType;
const SECOND_HIT = PATTERN[1] as DrumHitType;
const ICONS: Record<DrumHitType, string> = { kick: '🟣', snare: '🔴', hihat: '🟡' };

export default function DrumRhythmScreen() {
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState('Pulsa comenzar y toca el patrón a 90 BPM.');
  const [completed, setCompleted] = useState(false);
  const stepRef = useRef(0);
  const lastAcceptedAtRef = useRef<number | null>(null);

  const acceptAsFirstBeat = useCallback((hit: DetectedDrumHit) => {
    if (hit.type !== FIRST_HIT) {
      stepRef.current = 0;
      setStep(0);
      setFeedback(`Esperaba ${DRUM_LABELS[FIRST_HIT]}. Intenta comenzar otra vez.`);
      return;
    }
    stepRef.current = 1;
    lastAcceptedAtRef.current = hit.timestamp;
    setStep(1);
    setFeedback(`Bien. Ahora ${DRUM_LABELS[SECOND_HIT]}.`);
  }, []);

  const handleHit = useCallback((hit: DetectedDrumHit) => {
    const currentStep = stepRef.current;
    if (currentStep === 0) {
      acceptAsFirstBeat(hit);
      return;
    }

    const expectedType = PATTERN[currentStep];
    if (!expectedType) return;
    const elapsed = hit.timestamp - (lastAcceptedAtRef.current ?? hit.timestamp);
    const timingError = Math.abs(elapsed - BEAT_MS);
    if (hit.type !== expectedType || timingError > TIMING_TOLERANCE_MS) {
      if (hit.type === FIRST_HIT) {
        stepRef.current = 1;
        lastAcceptedAtRef.current = hit.timestamp;
        setStep(1);
        setFeedback('Secuencia reiniciada desde este bombo. Mantén el pulso.');
      } else {
        stepRef.current = 0;
        lastAcceptedAtRef.current = null;
        setStep(0);
        setFeedback(hit.type !== expectedType ? `Golpe incorrecto: esperaba ${DRUM_LABELS[expectedType]}.` : 'Fuera de tiempo. Vuelve a comenzar con bombo.');
      }
      return;
    }

    const nextStep = currentStep + 1;
    lastAcceptedAtRef.current = hit.timestamp;
    stepRef.current = nextStep;
    setStep(nextStep);
    if (nextStep >= PATTERN.length) {
      setCompleted(true);
      setEnabled(false);
      setFeedback('¡Patrón completado con ritmo estable!');
    } else {
      const nextType = PATTERN[nextStep];
      if (nextType) setFeedback(`Correcto. Sigue con ${DRUM_LABELS[nextType]}.`);
    }
  }, [acceptAsFirstBeat]);

  const detector = useDrumDetector({ enabled, onHit: handleHit });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  const start = () => {
    stepRef.current = 0;
    lastAcceptedAtRef.current = null;
    setStep(0);
    setCompleted(false);
    setFeedback('Empieza con bombo. Deja aproximadamente 667 ms entre golpes.');
    setEnabled(true);
  };

  return (
    <Screen scroll>
      <DevelopmentHeader title="Secuencia rítmica" subtitle="Patrón de 4 golpes · 90 BPM" />
      <View className="mt-6 rounded-3xl bg-white p-6">
        <AudioLevelBar level={detector.inputLevel} />
        <Text className="mt-6 text-center text-sm font-bold uppercase tracking-wider text-ink-muted">Secuencia</Text>
        <View className="mt-4 flex-row justify-center gap-2">
          {PATTERN.map((type, index) => (
            <View
              key={`${type}-${index}`}
              className={`h-16 w-16 items-center justify-center rounded-2xl border-2 ${index < step ? 'border-success bg-success-soft' : index === step && enabled ? 'border-orange-500 bg-orange-100' : 'border-slate-200 bg-surface-sunken'}`}
            >
              <Text className="text-2xl">{ICONS[type]}</Text>
              <Text className="mt-1 text-[10px] font-extrabold text-ink">{DRUM_LABELS[type]}</Text>
            </View>
          ))}
        </View>
        <View className="mt-6"><ProgressBar value={step / PATTERN.length} /></View>
        <Text className={`mt-5 text-center text-sm font-bold ${completed ? 'text-success' : 'text-ink'}`}>{feedback}</Text>
        {completed ? <Text className="mt-3 text-center text-2xl font-black text-success">✅ RITMO SUPERADO</Text> : null}
        {detector.error ? <Text className="mt-4 text-center text-sm font-semibold text-danger">{detector.error}</Text> : null}
        <Button label={enabled ? 'Escuchando patrón…' : completed ? 'Repetir patrón' : 'Comenzar'} disabled={enabled} onPress={start} className="mt-7" />
        {enabled ? <Button label="Detener" variant="ghost" onPress={() => setEnabled(false)} className="mt-2" /> : null}
      </View>
      <Text className="mt-4 text-xs leading-5 text-ink-muted">
        Margen temporal: ±{TIMING_TOLERANCE_MS} ms por golpe. La primera nota inicia el reloj del patrón.
      </Text>
    </Screen>
  );
}
