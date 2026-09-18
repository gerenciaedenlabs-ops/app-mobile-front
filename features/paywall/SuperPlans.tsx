import type { ReactNode } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';

import { TactileButton } from '@/components/TactileButton';
import { IconBlock, IconBolt, IconCard, IconCrown, IconHeart, IconMusicNote, IconSparkle } from '@/components/icons';
import { useBounce } from '@/hooks/useLoopAnimation';
import { presentCustomerCenter } from '@/lib/purchases';
import { GAME_COLORS } from '@/lib/theme';
import { useProgressStore } from '@/store/progressStore';
import { useThemeColors } from '@/store/themeStore';

import { PlanCard, type Plan } from './PlanCard';
import { usePlans } from './usePlans';

/** Verde oscuro del texto sobre el botón verde (on-primary-container). */
const ON_GREEN = '#1E5000';

function Benefit({ icon, iconBg, label }: { icon: ReactNode; iconBg: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-line border-b-4 bg-surface px-2 py-2.5">
      <View style={{ backgroundColor: iconBg }} className="mb-1 h-8 w-8 items-center justify-center rounded-full">
        {icon}
      </View>
      <Text className="text-center text-xs font-extrabold leading-4 text-ink">{label}</Text>
    </View>
  );
}

function Hero() {
  const translateY = useBounce(7, 3200);

  return (
    <View className="items-center pb-1 pt-2">
      <View className="h-36 w-36 items-center justify-center">
        <View className="absolute inset-2 rounded-full bg-[#FEC700]/25" />
        <View className="absolute right-2 top-1">
          <IconSparkle size={18} color="#FEC700" filled />
        </View>
        <View className="absolute bottom-4 left-3">
          <IconSparkle size={14} color="#FEC700" filled />
        </View>
        <View className="absolute left-3 top-5">
          <IconSparkle size={12} color="#4ABDFF" filled />
        </View>

        <Animated.View style={{ transform: [{ translateY }] }}>
          <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-b-[8px] border-[#FEC700]/40 bg-surface">
            <Image
              source={require('@/assets/brand/mascot.png')}
              accessibilityIgnoresInvertColors
              style={{ width: 92, height: 93 }}
              resizeMode="contain"
            />
            <View className="absolute -top-4">
              <IconCrown size={28} color="#F4BF00" filled strokeWidth={1.6} />
            </View>
            <View className="absolute -bottom-2 flex-row items-center gap-0.5 rounded-full border-b-2 border-[#6E5400] bg-[#FEC700] px-2.5 py-0.5">
              <IconBolt size={12} color="#6E5400" filled />
              <Text className="text-[11px] font-black tracking-wider text-[#6E5400]">PRO</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View className="mt-1 flex-row items-center justify-center gap-1.5">
        <Text className="text-[28px] font-extrabold text-brand-ink">Súper</Text>
        <Image
          source={require('@/assets/brand/wordmark.png')}
          accessibilityLabel="Ritmo"
          style={{ width: 50, height: 24 }}
          resizeMode="contain"
        />
        <IconSparkle size={20} color="#FEC700" filled />
      </View>
      <Text className="mt-0.5 max-w-[290px] text-center text-sm font-medium leading-5 text-ink-soft">
        Desbloquea todo tu potencial musical con afinación guiada en tiempo real.
      </Text>
    </View>
  );
}

/** Texto legal bajo el botón, según lo que declare la tienda para el plan. */
function Microcopy({ plan }: { plan: Plan }) {
  const priceText = `${plan.price}${plan.priceCaption ? ` ${plan.priceCaption}` : ''}`;
  const isLifetime = plan.id === 'lifetime' || plan.priceCaption === 'una vez';

  return (
    <Text className="max-w-[320px] text-center text-xs font-medium leading-5 text-ink-soft">
      {plan.trialDays ? (
        <>
          {plan.trialDays} días gratis. Luego <Text className="font-bold text-ink">{priceText}</Text>. Cancela en
          cualquier momento.
        </>
      ) : isLifetime ? (
        <>
          Pago único de <Text className="font-bold text-ink">{plan.price}</Text>.
        </>
      ) : (
        <>
          <Text className="font-bold text-ink">{priceText}</Text>. La suscripción se renueva automáticamente salvo
          cancelación 24 h antes del fin del periodo.
        </>
      )}
    </Text>
  );
}

interface SuperPlansProps {
  /** Tras comprar o restaurar con éxito (en el modal, cerrarlo). */
  onDone?: () => void;
}

/** Planes de Ritmo Súper (Diseno Nuevo/planes). */
export function SuperPlans({ onDone }: SuperPlansProps) {
  const colors = useThemeColors();
  const isPremium = useProgressStore((state) => state.isPremium);
  const { plans, selectedPlan, selectedPlanId, setSelectedPlanId, loading, subscribe, restore } = usePlans(onDone);

  return (
    <View className="pb-4">
      <Hero />

      <View className="mt-3 flex-row gap-2 px-1">
        <Benefit
          icon={<IconHeart size={18} color={colors.danger} filled />}
          iconBg="#FFDAD6"
          label={'Vidas\nilimitadas'}
        />
        <Benefit
          icon={<IconMusicNote size={18} color="#004C6E" filled />}
          iconBg="#C8E6FF"
          label={'Todos los\ninstrumentos'}
        />
        <Benefit icon={<IconBlock size={18} color="#082100" />} iconBg="#87FE45" label={'100% Sin\nanuncios'} />
      </View>

      {isPremium ? (
        <View className="mt-5 gap-3">
          <View className="items-center rounded-2xl border-2 border-b-[5px] border-brand-ink bg-surface p-4">
            <Text className="text-lg font-extrabold text-ink">¡Ya eres Súper!</Text>
            <Text className="mt-1 text-center text-[13px] font-medium text-ink-soft">
              Gracias por apoyar Ritmo. Tienes todas las ventajas activas.
            </Text>
          </View>
          <TactileButton
            label="Gestionar suscripción"
            height={52}
            color={colors.surfaceRaised}
            lipColor={colors.line}
            textColor={colors.ink}
            icon={<IconCard size={20} color={colors.ink} />}
            onPress={() => void presentCustomerCenter()}
          />
        </View>
      ) : (
        <>
          <View className="mt-5 gap-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={plan.id === selectedPlanId}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </View>

          <View className="mt-4 w-full items-center gap-2">
            <TactileButton
              label={
                loading
                  ? 'Conectando…'
                  : selectedPlan?.trialDays
                    ? `Probar ${selectedPlan.trialDays} días gratis`
                    : 'Suscribirme'
              }
              height={56}
              lip={5}
              color={GAME_COLORS.green.fill}
              lipColor={ON_GREEN}
              textColor={ON_GREEN}
              textClassName="text-[17px] font-black"
              icon={<IconBolt size={22} color={ON_GREEN} filled />}
              disabled={loading}
              className="w-full"
              onPress={() => void subscribe()}
            />

            {selectedPlan ? <Microcopy plan={selectedPlan} /> : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void restore()}
              hitSlop={8}
              className="py-1"
            >
              <Text className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                Restaurar compras
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
