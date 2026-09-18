import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { SuperPlans } from '@/features/paywall/SuperPlans';

/** Pestaña Súper: planes de suscripción (Diseno Nuevo/planes). */
export default function SuperScreen() {
  return (
    <Screen scroll edges={['top']} header={<AppHeader variant="plans" />}>
      <SuperPlans />
    </Screen>
  );
}
