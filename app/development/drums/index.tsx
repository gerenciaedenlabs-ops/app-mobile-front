import { Redirect } from 'expo-router';

import { DevelopmentTestMenu } from '@/components/development/DevelopmentTestMenu';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const TESTS = [
  {
    id: 'detector',
    icon: '🥁',
    title: 'Detector de piezas',
    description: 'Clasifica golpes aislados como bombo, caja o hi-hat y estima el tempo.',
    route: '/development/drums/detector' as const,
  },
  {
    id: 'rhythm',
    icon: '⏱️',
    title: 'Secuencia rítmica',
    description: 'Completa Bombo–Caja–Bombo–Caja manteniendo un pulso de 90 BPM.',
    route: '/development/drums/rhythm' as const,
  },
];

export default function DrumsDevelopmentMenuScreen() {
  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;
  return (
    <DevelopmentTestMenu
      title="Motor de Batería"
      description="Detección de ataques, clasificación tímbrica inicial y análisis temporal local."
      accentColor="#FFEDD5"
      tests={TESTS}
    />
  );
}
