import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

export interface Plan {
  id: string;
  title: string;
  price: string;
  period: string;
  badge?: string;
  /** TODO(RevenueCat): sustituir por el identificador del `Package` de la oferta. */
  packageId: string;
}

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.title}, ${plan.price} ${plan.period}`}
      onPress={onSelect}
      className={cn(
        'rounded-2xl border-2 bg-white p-4',
        selected ? 'border-brand bg-brand-soft' : 'border-slate-200',
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-extrabold text-ink">{plan.title}</Text>
            {plan.badge ? (
              <View className="rounded-full bg-warning px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-white">{plan.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs text-ink-muted">{plan.period}</Text>
        </View>

        <Text className="text-lg font-extrabold text-ink">{plan.price}</Text>
      </View>
    </Pressable>
  );
}
