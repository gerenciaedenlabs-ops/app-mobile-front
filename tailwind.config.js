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
  theme: {
    extend: {
      colors: {
        // Paleta base de EdenShip. Los acentos por instrumento viven en content/instruments.json.
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F1F5F9',
          raised: '#F8FAFC',
        },
        brand: {
          DEFAULT: '#6D28D9',
          soft: '#EDE9FE',
          strong: '#5B21B6',
        },
        success: {
          DEFAULT: '#16A34A',
          soft: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FEF3C7',
        },
        streak: '#F97316',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};
