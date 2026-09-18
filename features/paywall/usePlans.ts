/**
 * Carga de planes y compra con RevenueCat. Extraído de app/paywall.tsx sin
 * cambiar su lógica, para compartirlo entre el modal /paywall y la pestaña
 * Súper (Diseno Nuevo/planes).
 */
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import {
  getOfferings,
  getStoreProducts,
  purchasePackage,
  purchaseStoreProduct,
  restorePurchases,
} from '@/lib/purchases';
import { useProgressStore } from '@/store/progressStore';

import type { Plan } from './PlanCard';

const DEFAULT_PLANS: readonly Plan[] = [
  {
    id: 'yearly',
    title: 'Plan Anual',
    price: '59,99 €',
    period: '12 meses · 5,00 €/mes',
    badge: 'Ahorra 50%',
    packageId: '$rc_annual',
    priceValue: 59.99,
    pricePerMonth: '5,00 €',
    priceCaption: 'al año',
  },
  {
    id: 'monthly',
    title: 'Plan Mensual',
    price: '9,99 €',
    period: 'Cancela cuando quieras',
    packageId: '$rc_monthly',
    priceValue: 9.99,
    priceCaption: 'al mes',
  },
  {
    id: 'lifetime',
    title: 'De por vida',
    price: '149,99 €',
    period: 'Pago único para siempre',
    packageId: '$rc_lifetime',
    priceValue: 149.99,
    priceCaption: 'una vez',
  },
];

/** Días de prueba gratis que declara la tienda para el producto, si los hay. */
function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const perUnit: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  const days = (perUnit[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
}

function isAnnualPackage(pkg: PurchasesPackage) {
  const id = pkg.identifier.toLowerCase();
  return pkg.packageType === 'ANNUAL' || id.includes('annual') || id.includes('yearly');
}

function isMonthlyPackage(pkg: PurchasesPackage) {
  return pkg.packageType === 'MONTHLY' || pkg.identifier.toLowerCase().includes('monthly');
}

function isLifetimePackage(pkg: PurchasesPackage) {
  return pkg.packageType === 'LIFETIME' || pkg.identifier.toLowerCase().includes('lifetime');
}

export function usePlans(onDone?: () => void) {
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

  // Ahorro real del anual frente a pagar 12 mensualidades, si la tienda da ambos.
  const monthlyPackage = packages.find(isMonthlyPackage);
  const annualSavings = (() => {
    const annual = packages.find(isAnnualPackage);
    if (!annual || !monthlyPackage || monthlyPackage.product.price <= 0) return null;
    const pct = Math.round((1 - annual.product.price / (monthlyPackage.product.price * 12)) * 100);
    return pct > 0 ? pct : null;
  })();

  const plans: readonly Plan[] = packages.length > 0
    ? packages.map((pkg) => {
        const isLifetime = isLifetimePackage(pkg);
        const isAnnual = isAnnualPackage(pkg);
        const isMonthly = isMonthlyPackage(pkg);

        let title = pkg.product.title;
        let period = pkg.product.description;
        let badge: string | undefined;
        let priceCaption: string | undefined;

        if (isLifetime) {
          title = 'De por vida';
          period = 'Pago único para siempre';
          badge = 'Acceso total';
          priceCaption = 'una vez';
        } else if (isAnnual) {
          title = 'Plan Anual';
          period = '12 meses · Ahorro anual';
          badge = annualSavings ? `Ahorra ${annualSavings}%` : 'Más popular';
          priceCaption = 'al año';
        } else if (isMonthly) {
          title = 'Plan Mensual';
          period = 'Cancela cuando quieras';
          priceCaption = 'al mes';
        }

        return {
          id: pkg.identifier,
          title,
          price: pkg.product.priceString,
          period,
          badge,
          packageId: pkg.identifier,
          priceValue: pkg.product.price,
          pricePerMonth: isAnnual ? pkg.product.pricePerMonthString : null,
          trialDays: trialDaysOf(pkg),
          priceCaption,
        };
      })
    : DEFAULT_PLANS;

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

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
            { text: 'Aceptar', onPress: () => onDone?.() },
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
            { text: 'Aceptar', onPress: () => onDone?.() },
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
              onDone?.();
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
          { text: 'Aceptar', onPress: () => onDone?.() },
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

  return { plans, selectedPlan, selectedPlanId, setSelectedPlanId, loading, subscribe, restore };
}
