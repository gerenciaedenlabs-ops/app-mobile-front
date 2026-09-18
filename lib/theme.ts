/**
 * Colores del tema para el código que no puede usar clases de Tailwind:
 * props `color` de iconos SVG, estilos de la barra de pestañas, etc.
 *
 * Deben coincidir con las variables de global.css. Allí están los mismos
 * valores en RGB para las clases; aquí en hex para JS.
 */
export interface ThemeColors {
  ink: string;
  inkMuted: string;
  surface: string;
  surfaceSunken: string;
  surfaceRaised: string;
  line: string;
  brand: string;
  /** Texto en color de marca. */
  brandInk: string;
  /** Labio 3D inferior de botones de marca. */
  brandStrong: string;
  success: string;
  danger: string;
  warning: string;
  streak: string;
  /** Pestañas inactivas de la barra inferior. */
  tabInactive: string;
  /** Acento de la sección de desarrollo. */
  devAccent: string;
}

export const LIGHT_COLORS: ThemeColors = {
  ink: '#1B1C1C',
  inkMuted: '#6F7B64',
  surface: '#FFFFFF',
  surfaceSunken: '#FBF9F8',
  surfaceRaised: '#EAE8E7',
  line: '#EAE8E7',
  brand: '#58CC02',
  brandInk: '#2B6C00',
  brandStrong: '#46A302',
  success: '#58CC02',
  danger: '#DC2626',
  warning: '#D97706',
  streak: '#FF9600',
  tabInactive: '#3F4A36',
  devAccent: '#006590',
};

export const DARK_COLORS: ThemeColors = {
  ink: '#F4F4F5',
  inkMuted: '#A1A1AA',
  surface: '#26272C',
  surfaceSunken: '#18191D',
  surfaceRaised: '#303238',
  line: '#393B42',
  brand: '#8B5CF6',
  brandInk: '#A78BFA',
  brandStrong: '#6D28D9',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  streak: '#F97316',
  tabInactive: '#71717A',
  devAccent: '#67E8F9',
};

/**
 * Colores "de juego" del diseño (Diseno Nuevo/DESIGN.md). Son iguales en ambos
 * temas: son acentos saturados sobre cualquier fondo. `lip` es el borde 3D
 * inferior que da el efecto de botón físico.
 */
export const GAME_COLORS = {
  green: { fill: '#58CC02', lip: '#46A302' },
  blue: { fill: '#006590', lip: '#004563' },
  gold: { fill: '#FEC700', lip: '#CCA000' },
  purple: { fill: '#854CE6', lip: '#581C87' },
  flame: { fill: '#FF9600', lip: '#CC7800' },
} as const;

export type GameColor = keyof typeof GAME_COLORS;
