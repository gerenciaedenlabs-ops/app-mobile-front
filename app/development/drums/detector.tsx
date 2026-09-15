import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { AudioLevelBar } from '@/components/development/AudioLevelBar';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';
import { useDrumDetector } from '@/hooks/useDrumDetector';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { DRUM_LABELS, type DrumHitType } from '@/lib/drumDetection';

const DRUM_ICONS: Record<DrumHitType, string> = { kick: '🟣', snare: '🔴', hihat: '🟡' };

export default function DrumDetectorScreen() {
  const [enabled, setEnabled] = useState(false);
  const detector = useDrumDetector({ enabled });

  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;

  return (
    <Screen scroll>
      <DevelopmentHeader title="Detector de batería" subtitle="Bombo, caja, hi-hat y tempo" />
      <View className="mt-6 rounded-3xl bg-white p-6">
        <AudioLevelBar level={detector.inputLevel} />
        <View className="mt-7 items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-ink-muted">Último golpe</Text>
          <Text className="mt-3 text-6xl">{detector.latestHit ? DRUM_ICONS[detector.latestHit.type] : '🥁'}</Text>
          <Text className="mt-2 text-4xl font-black text-orange-700">
            {detector.latestHit ? DRUM_LABELS[detector.latestHit.type] : '—'}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-ink-muted">
            {detector.latestHit ? `${Math.round(detector.latestHit.confidence * 100)}% de confianza` : 'Da golpes aislados cerca del micrófono'}
          </Text>
          {detector.latestHit ? (
            <Text className="mt-2 text-center text-xs text-ink-muted">
              Graves {Math.round(detector.latestHit.lowRatio * 100)}% · Medios {Math.round(detector.latestHit.midRatio * 100)}% · Agudos {Math.round(detector.latestHit.highRatio * 100)}%
            </Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <View className="rounded-2xl bg-surface-sunken px-5 py-3">
              <Text className="text-center text-xs font-bold text-ink-muted">TEMPO</Text>
              <Text className="text-center text-2xl font-black text-ink">{detector.tempoBpm ?? '—'} BPM</Text>
            </View>
            <View className="rounded-2xl bg-surface-sunken px-5 py-3">
              <Text className="text-center text-xs font-bold text-ink-muted">GOLPES</Text>
              <Text className="text-center text-2xl font-black text-ink">{detector.history.length}</Text>
            </View>
          </View>
        </View>
        {detector.error ? <Text className="mt-4 text-center text-sm font-semibold text-danger">{detector.error}</Text> : null}
        <Button
          label={enabled ? 'Detener detector' : 'Escuchar batería'}
          variant={enabled ? 'secondary' : 'primary'}
          onPress={() => setEnabled((value) => !value)}
          className="mt-7"
        />
      </View>

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">Golpes recientes</Text>
      <View className="flex-row flex-wrap gap-2">
        {detector.history.length === 0 ? (
          <Text className="text-sm text-ink-muted">Todavía no hay golpes detectados.</Text>
        ) : detector.history.map((hit) => (
          <View key={hit.id} className="rounded-full bg-white px-3 py-2">
            <Text className="text-xs font-bold text-ink">{DRUM_ICONS[hit.type]} {DRUM_LABELS[hit.type]}</Text>
          </View>
        ))}
      </View>
      <Text className="mt-5 text-xs leading-5 text-ink-muted">
        Clasificación experimental por energía espectral. Funciona mejor con un solo golpe cada vez y poco ruido ambiente.
      </Text>
    </Screen>
  );
}
