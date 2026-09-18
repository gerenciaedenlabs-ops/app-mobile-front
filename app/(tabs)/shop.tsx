import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { IconBolt, IconCard, IconGift, IconSignalOff } from '@/components/icons';
import { useShopInventory, useShopItems } from '@/hooks/useContent';
import { useThemeColors } from '@/store/themeStore';
import type { ApiShopItem } from '@/types/api';

/** priceMoneyCents está en centavos; se asume USD porque RevenueCat todavía no manda moneda por artículo. */
function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ShopItemCard({ item }: { item: ApiShopItem }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line border-b-4 bg-surface p-4">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
        <IconGift size={22} color={colors.brand} filled />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[15px] font-bold text-ink">
          {item.name}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} className="text-xs font-medium text-ink-soft">
            {item.description}
          </Text>
        ) : null}
        <Text className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
          {item.itemTypeName}
        </Text>
      </View>
      {item.priceGems !== null ? (
        <View className="flex-row items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1">
          <IconBolt size={14} color={colors.warning} filled />
          <Text className="text-xs font-extrabold text-warning">{item.priceGems}</Text>
        </View>
      ) : item.priceMoneyCents !== null ? (
        <View className="flex-row items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1">
          <IconCard size={14} color={colors.ink} />
          <Text className="text-xs font-extrabold text-ink">{formatMoney(item.priceMoneyCents)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ShopScreen() {
  const colors = useThemeColors();
  const items = useShopItems();
  const inventory = useShopInventory();

  return (
    <Screen scroll edges={['top']}>
      <View className="py-2">
        <Text className="text-2xl font-extrabold text-ink">Tienda</Text>
        <Text className="mt-1 text-xs text-ink-muted">
          Canjea tus gemas por congelar racha, recargas de vidas y más.
        </Text>
      </View>

      {/* Mi inventario */}
      {(inventory.data ?? []).length > 0 ? (
        <View className="mt-4 gap-2">
          <Text className="px-1 text-base font-bold text-ink">Mi inventario</Text>
          <View className="flex-row flex-wrap gap-2">
            {(inventory.data ?? []).map((entry) => (
              <View
                key={entry.itemId}
                className="flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
              >
                <Text className="text-xs font-bold text-ink">{entry.itemName}</Text>
                <Text className="text-xs font-extrabold text-brand-ink">×{entry.quantity}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Catálogo */}
      <View className="mb-3 mt-6">
        <Text className="px-1 text-base font-bold text-ink">Catálogo</Text>
      </View>

      {items.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : items.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudo cargar la tienda"
          description={items.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
        />
      ) : (items.data ?? []).length === 0 ? (
        <EmptyState icon={<IconGift size={40} color={colors.inkMuted} />} title="Próximamente" description="Todavía no hay artículos en la tienda." />
      ) : (
        <View className="gap-3">
          {(items.data ?? []).map((item) => (
            <ShopItemCard key={item.id} item={item} />
          ))}
        </View>
      )}

      {/* Sin endpoint de compra todavía: el catálogo es solo informativo por ahora. */}
    </Screen>
  );
}
