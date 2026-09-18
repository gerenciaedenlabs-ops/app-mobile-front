import { Pressable, Text, View } from 'react-native';

import { IconCheck, IconSparkle } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useThemeColors } from '@/store/themeStore';

export interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  badge?: string;
  /** TODO(RevenueCat): sustituir por el identificador del `Package` de la oferta. */
  packageId: string;
  /** Precio numérico, para calcular el ahorro entre planes. */
  priceValue?: number;
  /** Precio mensual equivalente formateado por la tienda ("5,00 €"). */
  pricePerMonth?: string | null;
  /** Días de prueba gratis si la tienda los ofrece para este producto. */
  trialDays?: number | null;
  /** Texto corto bajo el precio ("al año", "al mes"). */
  priceCaption?: string;
}

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}

/** Tarjeta de plan (Diseno Nuevo/planes: `.plan-card`). */
export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const colors = useThemeColors();
  const subtitle = plan.pricePerMonth ? `${plan.pricePerMonth} / mes` : plan.period;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.title}, ${plan.price} ${plan.priceCaption ?? plan.period}`}
      onPress={onSelect}
      className={cn(
        'rounded-2xl border-2 bg-surface p-3.5',
        selected ? 'border-brand-ink border-b-[5px]' : 'border-transparent border-b-4 border-b-line',
      )}
    >
      {plan.badge ? (
        <View className="absolute -top-3 right-4 flex-row items-center gap-1 rounded-full border-b-2 border-[#6E5400] bg-[#FEC700] px-2.5 py-0.5">
          <IconSparkle size={11} color="#6E5400" filled />
          <Text className="text-[11px] font-black uppercase tracking-wide text-[#6E5400]">{plan.badge}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View
            className={cn(
              'h-6 w-6 items-center justify-center rounded-full',
              selected ? 'bg-brand-ink' : 'bg-surface-raised',
            )}
          >
            {selected ? <IconCheck size={16} color={colors.surface} strokeWidth={3} /> : null}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-extrabold text-ink">{plan.title}</Text>
            <Text
              numberOfLines={1}
              className={cn('text-[13px]', plan.pricePerMonth ? 'font-bold text-brand-ink' : 'font-medium text-ink-soft')}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-[17px] font-black text-ink">{plan.price}</Text>
          {plan.priceCaption ? (
            <Text className="text-[11px] font-medium text-ink-soft">{plan.priceCaption}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
