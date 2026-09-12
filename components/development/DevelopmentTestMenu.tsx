import { type Href, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { DevelopmentHeader } from '@/components/development/DevelopmentHeader';

interface DevelopmentTest {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
}

interface DevelopmentTestMenuProps {
  title: string;
  description: string;
  accentColor: string;
  tests: readonly DevelopmentTest[];
}

export function DevelopmentTestMenu({
  title,
  description,
  accentColor,
  tests,
}: DevelopmentTestMenuProps) {
  const router = useRouter();
  return (
    <Screen scroll>
      <DevelopmentHeader title={title} subtitle="Selecciona una modalidad de prueba" />
      <Text className="mt-5 text-3xl font-extrabold text-ink">¿Qué quieres probar?</Text>
      <Text className="mt-2 text-sm leading-5 text-ink-muted">{description}</Text>
      <View className="mt-6 gap-4">
        {tests.map((test) => (
          <Pressable
            key={test.id}
            accessibilityRole="button"
            accessibilityLabel={test.title}
            onPress={() => router.push(test.route as Href)}
            className="rounded-3xl border-2 border-slate-200 bg-white p-5 active:bg-surface-sunken"
          >
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accentColor }}
            >
              <Text className="text-3xl">{test.icon}</Text>
            </View>
            <Text className="mt-4 text-xl font-extrabold text-ink">{test.title}</Text>
            <Text className="mt-1 text-sm leading-5 text-ink-muted">{test.description}</Text>
            <Text className="mt-4 text-sm font-extrabold text-cyan-700">ABRIR PRUEBA →</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
