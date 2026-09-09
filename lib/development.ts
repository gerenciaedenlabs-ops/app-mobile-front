/**
 * Interruptor de interfaz, no una frontera de seguridad: las variables EXPO_PUBLIC
 * se incluyen en el bundle. El valor debe coincidir exactamente.
 */
export const DEVELOPMENT_SECTION_ENABLED =
  process.env.EXPO_PUBLIC_DEVELOPMENT_SECTION === 'desarrollo';
