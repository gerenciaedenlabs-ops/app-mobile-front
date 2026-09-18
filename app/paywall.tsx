import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SuperPlans } from '@/features/paywall/SuperPlans';

/** Modal de planes: el mismo contenido que la pestaña Súper, con botón de cerrar. */
export default function PaywallScreen() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View className="flex-row justify-start py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <Text className="text-base font-bold text-ink-soft">✕</Text>
        </Pressable>
      </View>
      <SuperPlans onDone={() => router.back()} />
    </Screen>
  );
}
