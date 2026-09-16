import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { useProgressStore } from '@/store/progressStore';

/**
 * Entitlement principal configurado en el dashboard de RevenueCat para Ritmo Pro.
 */
export const REVENUECAT_ENTITLEMENT_ID = 'ritmo_pro';

/**
 * Identificadores de productos configurados para Ritmo:
 * - Lifetime: 'lifetime' (o $rc_lifetime)
 * - Yearly: 'yearly' (o $rc_annual)
 * - Monthly: 'monthly' (o $rc_monthly)
 */
export const REVENUECAT_PRODUCT_IDS = {
  LIFETIME: 'lifetime',
  YEARLY: 'yearly',
  MONTHLY: 'monthly',
} as const;

// Llaves de API de RevenueCat por plataforma
const IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  'test_ccrWlYYTysuqqtLVbjMHCcCCIII';

const ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  'test_ccrWlYYTysuqqtLVbjMHCcCCIII';

let isPurchasesConfigured = false;
let customerInfoInFlight: Promise<boolean> | null = null;
let currentSyncedUserId: string | null = null;

/**
 * Inicializa y configura el SDK de RevenueCat según la plataforma.
 */
export function configurePurchases(): void {
  if (isPurchasesConfigured) return;
  if (Platform.OS === 'web') return;

  try {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
    if (apiKey) {
      Purchases.configure({ apiKey });
      isPurchasesConfigured = true;
    }

    if (isPurchasesConfigured) {
      // Escucha actualizaciones automáticas del cliente (renovaciones, compras, cambios de estado)
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        syncEntitlements(customerInfo);
      });
    }
  } catch (error) {
    console.warn('[RevenueCat] No se pudo inicializar Purchases:', error);
  }
}

/**
 * Verifica si el usuario tiene activo el entitlement 'ritmo_pro' y sincroniza el store global.
 */
export function syncEntitlements(customerInfo: CustomerInfo): boolean {
  const hasEntitlement = typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== 'undefined';
  useProgressStore.getState().setPremium(hasEntitlement);
  return hasEntitlement;
}

/**
 * Consulta la información del cliente con deduplicación de peticiones en vuelo (evita error 429).
 */
export async function checkCustomerEntitlement(): Promise<boolean> {
  if (!isPurchasesConfigured || Platform.OS === 'web') return false;

  if (customerInfoInFlight) {
    return customerInfoInFlight;
  }

  customerInfoInFlight = (async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return syncEntitlements(customerInfo);
    } catch (error) {
      console.warn('[RevenueCat] Error fetching customer info:', error);
      return false;
    } finally {
      customerInfoInFlight = null;
    }
  })();

  return customerInfoInFlight;
}

/**
 * Vincula el ID de usuario autenticado con RevenueCat o desvincula al cerrar sesión.
 * Evita llamadas redundantes a logIn si el usuario ya está sincronizado.
 */
export async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!isPurchasesConfigured || Platform.OS === 'web') return;

  // Si ya estamos sincronizados con este usuario, solo chequeamos entitlements
  if (currentSyncedUserId === userId) {
    void checkCustomerEntitlement();
    return;
  }

  try {
    if (userId) {
      const currentAppUserId = await Purchases.getAppUserID().catch(() => null);
      if (currentAppUserId === userId) {
        currentSyncedUserId = userId;
        void checkCustomerEntitlement();
        return;
      }

      const { customerInfo } = await Purchases.logIn(userId);
      currentSyncedUserId = userId;
      syncEntitlements(customerInfo);
    } else {
      const isAnon = await Purchases.isAnonymous().catch(() => true);
      if (!isAnon) {
        const customerInfo = await Purchases.logOut();
        currentSyncedUserId = null;
        syncEntitlements(customerInfo);
      } else {
        currentSyncedUserId = null;
      }
    }
  } catch (error) {
    console.warn('[RevenueCat] Error al sincronizar usuario con Purchases:', error);
  }
}

/**
 * Presenta el Paywall nativo preconfigurado en el Dashboard de RevenueCat.
 * Retorna true si el usuario compró o restauró la suscripción.
 */
export async function presentPaywall(): Promise<boolean> {
  if (!isPurchasesConfigured || Platform.OS === 'web') {
    return false;
  }

  try {
    const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        useProgressStore.getState().setPremium(true);
        return true;
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
      default:
        return false;
    }
  } catch (error) {
    console.warn('[RevenueCat] Error presentando el Paywall de RevenueCat:', error);
    return false;
  }
}

/**
 * Presenta el Customer Center nativo de RevenueCat para que el usuario gestione su suscripción,
 * revise el historial, cancele o solicite reembolsos (iOS).
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!isPurchasesConfigured || Platform.OS === 'web') {
    return;
  }

  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.warn('[RevenueCat] Error al presentar Customer Center:', error);
  }
}

/**
 * Restaura compras previas del usuario.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isPurchasesConfigured || Platform.OS === 'web') return false;

  try {
    const customerInfo = await Purchases.restorePurchases();
    return syncEntitlements(customerInfo);
  } catch (error) {
    console.warn('[RevenueCat] Error al restaurar compras:', error);
    throw error;
  }
}

/**
 * Obtiene las ofertas (Offerings) disponibles desde RevenueCat.
 * Si 'current' no está asignada, toma la primera oferta disponible en 'all'.
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isPurchasesConfigured) return null;

  try {
    const offerings = await Purchases.getOfferings();
    const resolvedOffering = offerings.current ?? Object.values(offerings.all)[0] ?? null;
    const packagesCount = resolvedOffering?.availablePackages?.length ?? 0;
    console.log(`[RevenueCat] Offerings cargadas (${packagesCount} paquetes disponibles):`, {
      currentOfferingId: offerings.current?.identifier,
      allOfferings: Object.keys(offerings.all),
      packages: resolvedOffering?.availablePackages?.map((p) => p.identifier) ?? [],
    });
    return resolvedOffering;
  } catch (error) {
    console.warn('[RevenueCat] Error al cargar offerings:', error);
    return null;
  }
}

/**
 * Obtiene productos individuales desde la tienda (útil si no se usan offerings).
 */
export async function getStoreProducts(
  productIds: string[] = [REVENUECAT_PRODUCT_IDS.YEARLY, REVENUECAT_PRODUCT_IDS.MONTHLY, REVENUECAT_PRODUCT_IDS.LIFETIME]
) {
  if (!isPurchasesConfigured) return [];
  try {
    const prods = await Purchases.getProducts(productIds);
    console.log(`[RevenueCat] StoreProducts cargados (${prods.length} productos):`, prods.map((p) => p.identifier));
    return prods;
  } catch (error) {
    console.warn('[RevenueCat] Error al cargar store products:', error);
    return [];
  }
}

/**
 * Compra directamente un paquete específico de RevenueCat.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!isPurchasesConfigured) return false;

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return syncEntitlements(customerInfo);
  } catch (error: any) {
    if (error?.userCancelled) return false;
    console.warn('[RevenueCat] Error en purchasePackage:', error);
    throw error;
  }
}

/**
 * Compra directamente un producto de la tienda (StoreProduct).
 */
export async function purchaseStoreProduct(product: any): Promise<boolean> {
  if (!isPurchasesConfigured) return false;

  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return syncEntitlements(customerInfo);
  } catch (error: any) {
    if (error?.userCancelled) return false;
    console.warn('[RevenueCat] Error en purchaseStoreProduct:', error);
    throw error;
  }
}
