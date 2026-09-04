import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { PlanCard, type Plan } from '@/features/paywall/PlanCard';
import { useProgressStore } from '@/store/progressStore';

/**
 * TODO(RevenueCat): reemplazar por los `Package` de la `Offering` actual
 * (`Purchases.getOfferings()`). Los precios NO deben quedar escritos a mano:
 * vienen localizados desde la tienda.
 */
const PLANS: readonly Plan[] = [
  { id: 'annual', title: 'Anual', price: '59,99 €', period: '12 meses · 5 €/mes', badge: 'Ahorra 50%', packageId: '$rc_annual' },
  { id: 'monthly', title: 'Mensual', price: '9,99 €', period: 'Renovación cada mes', packageId: '$rc_monthly' },
];

const BENEFITS = [
  { icon: '❤️', title: 'Vidas ilimitadas', description: 'Falla sin quedarte fuera de la lección.' },
  { icon: '🔓', title: 'Todas las unidades', description: 'Acceso completo a los cuatro instrumentos.' },
  { icon: '🎤', title: 'Feedback de guitarra', description: 'Detección de notas y acordes en tiempo real.' },
  { icon: '📈', title: 'Estadísticas avanzadas', description: 'Precisión rítmica y evolución por semana.' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const setPremium = useProgressStore((state) => state.setPremium);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('annual');

  const subscribe = () => {
    // TODO(RevenueCat): await Purchases.purchasePackage(selectedPackage) y activar
    // premium solo si `customerInfo.entitlements.active['premium']` existe.
    // Hoy solo simula la compra para poder recorrer el flujo completo.
    Alert.alert(
      'Compra no conectada',
      `Aquí iría la compra de "${selectedPlanId}" con RevenueCat.\n\nSe activa Premium en local para poder probar el flujo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Simular compra',
          onPress: () => {
            setPremium(true);
            router.back();
          },
        },
      ],
    );
  };

  const restore = () => {
    // TODO(RevenueCat): Purchases.restorePurchases().
    Alert.alert('Restaurar compras', 'Pendiente de conectar con RevenueCat.');
  };

  return (
    <Screen scroll>
      <View className="flex-row justify-end py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Text className="text-xl text-ink-muted">✕</Text>
        </Pressable>
      </View>

      <View className="items-center">
        <Text className="text-5xl">👑</Text>
        <Text className="mt-3 text-center text-3xl font-extrabold text-ink">EdenShip Premium</Text>
        <Text className="mt-1 text-center text-sm text-ink-muted">
          Practica sin límites y desbloquea todo el catálogo.
        </Text>
      </View>

      <View className="mt-8 gap-3">
        {BENEFITS.map((benefit) => (
          <View key={benefit.title} className="flex-row items-start gap-3">
            <Text className="text-xl">{benefit.icon}</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-ink">{benefit.title}</Text>
              <Text className="text-xs text-ink-muted">{benefit.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-8 gap-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlanId}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </View>

      <Button label="Suscribirse" onPress={subscribe} className="mt-6" />
      <Button label="Restaurar compras" variant="ghost" size="md" onPress={restore} className="mt-2" />

      <Text className="mt-4 text-center text-[11px] leading-4 text-ink-muted">
        Precios de ejemplo. La suscripción se renueva automáticamente salvo cancelación 24 h antes
        del fin del periodo.
      </Text>
    </Screen>
  );
}
