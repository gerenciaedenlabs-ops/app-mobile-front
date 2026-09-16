import { Redirect } from 'expo-router';

import { DevelopmentTestMenu } from '@/components/development/DevelopmentTestMenu';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';

const TESTS = [
  {
    id: 'target',
    icon: '🎯',
    title: 'Alcanzar una nota',
    description: 'Elige una tecla y tócala afinada durante 1,2 segundos.',
    route: '/development/piano/target' as const,
  },
  {
    id: 'detector',
    icon: '🎹',
    title: 'Detección libre',
    description: 'Observa en vivo una nota individual o varias notas de un acorde.',
    route: '/development/piano/detector' as const,
  },
];

export default function PianoDevelopmentMenuScreen() {
  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;
  return (
    <DevelopmentTestMenu
      title="Motor de Piano"
      description="Afinación monofónica y reconocimiento espectral de hasta cuatro notas simultáneas."
      accentColor="#DBEAFE"
      tests={TESTS}
    />
  );
}
