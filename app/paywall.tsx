import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { PlanCard, type Plan } from '@/features/paywall/PlanCard';
import {
  getOfferings,
  getStoreProducts,
  purchasePackage,
  purchaseStoreProduct,
  restorePurchases,
} from '@/lib/purchases';
import { useProgressStore } from '@/store/progressStore';

const DEFAULT_PLANS: readonly Plan[] = [
  {
    id: 'yearly',
    title: 'Anual',
    price: '59,99 €',
    period: '12 meses · 5,00 €/mes',
    badge: 'Más popular (Ahorra 50%)',
    packageId: '$rc_annual',
  },
  {
    id: 'monthly',
    title: 'Mensual',
    price: '9,99 €',
    period: 'Renovación cada mes',
    packageId: '$rc_monthly',
  },
  {
    id: 'lifetime',
    title: 'De por vida',
    price: '149,99 €',
    period: 'Pago único para siempre',
    badge: 'Acceso total',
    packageId: '$rc_lifetime',
  },
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // 1. Carga las ofertas y paquetes de RevenueCat
    void getOfferings().then((offering) => {
      if (mounted && offering?.availablePackages && offering.availablePackages.length > 0) {
        setPackages(offering.availablePackages);
        const firstPackage = offering.availablePackages[0];
        if (firstPackage) setSelectedPlanId(firstPackage.identifier);
      }
    });

    // 2. Carga productos directos de la tienda como respaldo
    void getStoreProducts().then((prods) => {
      if (mounted && prods && prods.length > 0) {
        setStoreProducts(prods);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const displayPlans: readonly Plan[] = packages.length > 0
    ? packages.map((pkg) => {
        const idLower = pkg.identifier.toLowerCase();
        const isLifetime = pkg.packageType === 'LIFETIME' || idLower.includes('lifetime');
        const isAnnual = pkg.packageType === 'ANNUAL' || idLower.includes('annual') || idLower.includes('yearly');
        const isMonthly = pkg.packageType === 'MONTHLY' || idLower.includes('monthly');

        let title = pkg.product.title;
        let period = pkg.product.description;
        let badge: string | undefined;

        if (isLifetime) {
          title = 'De por vida';
          period = 'Pago único para siempre';
          badge = 'Acceso total';
        } else if (isAnnual) {
          title = 'Anual';
          period = '12 meses · Ahorro anual';
          badge = 'Más popular';
        } else if (isMonthly) {
          title = 'Mensual';
          period = 'Renovación cada mes';
        }

        return {
          id: pkg.identifier,
          title,
          price: pkg.product.priceString,
          period,
          badge,
          packageId: pkg.identifier,
        };
      })
    : DEFAULT_PLANS;

  const subscribe = async () => {
    setLoading(true);
    try {
      // 1. Si hay un paquete de RevenueCat que coincida con la selección, lo compra directamente
      const matchedPkg = packages.find((p) => {
        if (p.identifier === selectedPlanId) return true;
        const id = p.identifier.toLowerCase();
        if (selectedPlanId === 'yearly' && (id.includes('annual') || id.includes('yearly') || p.packageType === 'ANNUAL')) return true;
        if (selectedPlanId === 'monthly' && (id.includes('monthly') || p.packageType === 'MONTHLY')) return true;
        if (selectedPlanId === 'lifetime' && (id.includes('lifetime') || p.packageType === 'LIFETIME')) return true;
        return false;
      });

      if (matchedPkg) {
        const purchased = await purchasePackage(matchedPkg);
        if (purchased) {
          setPremium(true);
          Alert.alert('¡Bienvenido a Ritmo Pro!', 'Tu suscripción se ha activado con éxito.', [
            { text: 'Aceptar', onPress: () => router.back() },
          ]);
        }
        return;
      }

      // 2. Si no hay paquete de Offering pero sí StoreProduct cargado, compra directa de producto
      const matchedProduct = storeProducts.find((sp) => {
        const id = sp.identifier.toLowerCase();
        if (sp.identifier === selectedPlanId) return true;
        if (selectedPlanId === 'yearly' && (id.includes('annual') || id.includes('yearly'))) return true;
        if (selectedPlanId === 'monthly' && id.includes('monthly')) return true;
        if (selectedPlanId === 'lifetime' && id.includes('lifetime')) return true;
        return false;
      });

      if (matchedProduct) {
        const purchased = await purchaseStoreProduct(matchedProduct);
        if (purchased) {
          setPremium(true);
          Alert.alert('¡Bienvenido a Ritmo Pro!', 'Tu suscripción se ha activado con éxito.', [
            { text: 'Aceptar', onPress: () => router.back() },
          ]);
        }
        return;
      }

      // 3. Si no hay paquetes de RevenueCat cargados en Expo Go / desarrollo
      Alert.alert(
        'Modo Desarrollo / Expo Go',
        'RevenueCat no devolvió paquetes de la tienda para esta oferta (en Expo Go las pasarelas nativas de Apple y Google no están disponibles).\n\n¿Deseas activar Ritmo Pro para continuar probando la app?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Activar Ritmo Pro',
            onPress: () => {
              setPremium(true);
              Alert.alert('¡Ritmo Pro activado!', 'Tienes vidas infinitas y todas las unidades desbloqueadas.');
              router.back();
            },
          },
        ],
      );
    } catch (error: any) {
      if (!error?.userCancelled) {
        Alert.alert('Error en el proceso de pago', error?.message ?? 'No se pudo completar la compra con RevenueCat.');
      }
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setLoading(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        setPremium(true);
        Alert.alert('Compras restauradas', 'Tu suscripción Ritmo Pro está activa.', [
          { text: 'Aceptar', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Restaurar compras', 'No se encontraron compras activas para este usuario.');
      }
    } catch (error: any) {
      Alert.alert('Error al restaurar', error?.message ?? 'No se pudieron restaurar las compras.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View className="flex-row justify-start py-2">
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

      <View className="mt-2 items-center">
        <View className="w-full rounded-xl bg-warning px-4 py-2">
          <Text className="text-center text-xs font-extrabold uppercase tracking-widest text-white">
            Oferta especial para músicos
          </Text>
        </View>
        <Text className="mt-5 text-center text-3xl font-extrabold leading-10 text-ink">
          Practica sin límites con Ritmo Premium
        </Text>
        <Text className="mt-2 text-center text-sm text-ink-muted">
          Más práctica, todo el catálogo y ninguna pausa por vidas.
        </Text>

        <View className="my-7 h-36 w-full items-center justify-center rounded-3xl bg-brand-soft">
          <View className="flex-row items-end gap-2">
            <Text className="text-5xl">🎸</Text>
            <Text className="text-7xl">👑</Text>
            <Text className="text-5xl">🎹</Text>
          </View>
        </View>
      </View>

      <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
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

      <Text className="mb-3 mt-7 text-lg font-extrabold text-ink">Elige tu plan</Text>
      <View className="gap-3">
        {displayPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlanId}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </View>

      <Button
        label={loading ? 'Conectando con RevenueCat…' : 'Empezar con Premium'}
        disabled={loading}
        onPress={() => void subscribe()}
        className="mt-6"
      />
      <Button
        label="Restaurar compras"
        variant="ghost"
        size="md"
        disabled={loading}
        onPress={() => void restore()}
        className="mt-2"
      />

      <Text className="mt-4 text-center text-[11px] leading-4 text-ink-muted">
        Precios de ejemplo. La suscripción se renueva automáticamente salvo cancelación 24 h antes
        del fin del periodo.
      </Text>
    </Screen>
  );
}
