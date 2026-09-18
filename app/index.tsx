import { Redirect } from 'expo-router';

import { useProgressStore } from '@/store/progressStore';

export default function Index() {
  // `hasHydrated` ya está garantizado por el layout raíz, así que aquí el valor
  // persistido es el definitivo.
  const lastInstrumentId = useProgressStore((state) => state.lastInstrumentId);

  // Primer ingreso: no hay instrumento elegido todavía, así que abrimos el
  // catálogo de cursos en vez de meter al alumno en uno cualquiera.
  return <Redirect href={lastInstrumentId ? '/(tabs)/ruta' : '/(tabs)/courses'} />;
}
