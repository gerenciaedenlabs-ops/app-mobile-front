/**
 * Preferencia de tema (claro / oscuro). Es del dispositivo, no del alumno:
 * se guarda aparte del progreso y sobrevive a cerrar sesión.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '@/lib/theme';

interface ThemeState {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

/**
 * Activa las variables `.dark:root` de global.css. En nativo también cambia
 * `Appearance`, así que alertas y teclado siguen el tema de la app.
 */
function applyColorScheme(darkMode: boolean) {
  try {
    colorScheme.set(darkMode ? 'dark' : 'light');
  } catch {
    // En web sin `window` (render estático) NativeWind no puede cambiar el
    // esquema; el cliente lo aplicará al rehidratar.
  }
}

// El tema claro es el predeterminado: no seguimos el esquema del sistema
// mientras se lee la preferencia guardada.
applyColorScheme(false);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (enabled) => {
        applyColorScheme(enabled);
        set({ darkMode: enabled });
      },
    }),
    {
      name: 'ritmo-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ darkMode: state.darkMode }),
      onRehydrateStorage: () => (state) => {
        applyColorScheme(state?.darkMode ?? false);
      },
    },
  ),
);

/** Colores del tema activo, para props `color` y estilos en línea. */
export function useThemeColors(): ThemeColors {
  const darkMode = useThemeStore((state) => state.darkMode);
  return darkMode ? DARK_COLORS : LIGHT_COLORS;
}
