/** Color que sale de una variable de tema de global.css y admite opacidad. */
const themeColor = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/**
 * Nunito Sans (diseño "Gamified Music Learning System"). En React Native cada
 * peso es una fuente distinta cargada con expo-font en app/_layout.tsx, así que
 * las clases de peso (`font-bold`, `font-extrabold`…) eligen la familia en vez
 * de fijar `fontWeight`, que con fuentes personalizadas no selecciona variante.
 */
const FONT_BY_WEIGHT = {
  normal: 'NunitoSans_400Regular',
  medium: 'NunitoSans_500Medium',
  semibold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
  extrabold: 'NunitoSans_800ExtraBold',
  black: 'NunitoSans_900Black',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Evita que NativeWind intente controlar manualmente un esquema ligado a
  // `media` cuando la hoja CSS se inyecta tarde durante el desarrollo web.
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Sustituido por el plugin de abajo, que mapea cada peso a su fuente.
  corePlugins: { fontWeight: false },
  theme: {
    extend: {
      colors: {
        // Paleta base de Ritmo. Los valores viven como variables CSS en
        // global.css (tema claro en `:root`, oscuro en `.dark:root`), así que el
        // cambio de tema no obliga a tocar pantallas. Los acentos por instrumento
        // viven en content/instruments.json.
        ink: {
          DEFAULT: themeColor('ink'),
          soft: themeColor('ink-soft'),
          muted: themeColor('ink-muted'),
        },
        surface: {
          // Tarjetas y barras.
          DEFAULT: themeColor('surface'),
          // Fondo de la app.
          sunken: themeColor('surface-sunken'),
          // Estados pulsados y elementos bloqueados.
          raised: themeColor('surface-raised'),
        },
        // Bordes y divisores.
        line: {
          DEFAULT: themeColor('line'),
          strong: themeColor('line-strong'),
        },
        brand: {
          // Relleno de botones y elementos destacados.
          DEFAULT: themeColor('brand'),
          soft: themeColor('brand-soft'),
          // "Labio" 3D inferior de botones y nodos.
          strong: themeColor('brand-strong'),
          // Texto en color de marca (el relleno no siempre tiene contraste).
          ink: themeColor('brand-ink'),
        },
        success: {
          DEFAULT: themeColor('success'),
          soft: themeColor('success-soft'),
        },
        danger: {
          DEFAULT: themeColor('danger'),
          soft: themeColor('danger-soft'),
        },
        warning: {
          DEFAULT: themeColor('warning'),
          soft: themeColor('warning-soft'),
        },
        streak: themeColor('streak'),
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities(
        Object.fromEntries(
          Object.entries(FONT_BY_WEIGHT).map(([weight, family]) => [
            `.font-${weight}`,
            { fontFamily: family },
          ]),
        ),
      );
    },
  ],
};
