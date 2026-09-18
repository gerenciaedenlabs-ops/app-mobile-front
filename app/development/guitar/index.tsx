import { Redirect } from 'expo-router';

import { DevelopmentTestMenu } from '@/components/development/DevelopmentTestMenu';
import { DEVELOPMENT_SECTION_ENABLED } from '@/lib/development';
import { useThemeStore } from '@/store/themeStore';

const TESTS = [
  {
    id: 'target',
    icon: '🎯',
    title: 'Nota objetivo',
    description: 'Elige una cuerda y mantenla afinada durante 1,5 segundos.',
    route: '/development/guitar/target' as const,
  },
  {
    id: 'detector',
    icon: '🎸',
    title: 'Detector libre de notas',
    description: 'Toca una cuerda y observa nota, octava, frecuencia y afinación en vivo.',
    route: '/development/guitar/tuner' as const,
  },
];

export default function GuitarDevelopmentMenuScreen() {
  const darkMode = useThemeStore((state) => state.darkMode);
  if (!DEVELOPMENT_SECTION_ENABLED) return <Redirect href="/" />;
  return (
    <DevelopmentTestMenu
      title="Motor de Guitarra"
      description="Detección monofónica en tiempo real para afinar y validar cuerdas individuales."
      accentColor={darkMode ? '#2D2545' : '#EDE9FE'}
      tests={TESTS}
    />
  );
}
