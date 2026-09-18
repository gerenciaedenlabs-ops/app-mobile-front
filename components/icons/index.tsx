/**
 * Set de iconos propio, dibujado sobre `react-native-svg` (ya presente en el
 * proyecto). Evita sumar una librería de iconos y nos deja controlar el trazo.
 *
 * Todos comparten lenguaje visual: rejilla de 24, esquinas y puntas redondeadas
 * y una variante `filled` que rellena la silueta con el propio color a baja
 * opacidad (duotono). Esa variante es la que usamos en la pestaña activa.
 */
import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export interface IconProps {
  size?: number;
  /** Acepta el ColorValue que entrega react-navigation en tabBarIcon. */
  color?: ColorValue;
  /** Variante sólida para estados activos. */
  filled?: boolean;
  strokeWidth?: number;
}

/** Opacidad del relleno en la variante duotono. */
const FILL_OPACITY = 0.18;

function iconStyle({ color = '#0F172A', filled = false, strokeWidth = 1.9 }: IconProps) {
  return {
    fill: filled ? color : 'none',
    fillOpacity: filled ? FILL_OPACITY : 0,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

/** Casa. Pestaña "Ruta". */
export function IconHome(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.6 10.9 L12 3.8 L20.4 10.9 V18.6 A2.4 2.4 0 0 1 18 21 H6 A2.4 2.4 0 0 1 3.6 18.6 Z" {...s} />
      <Path d="M9.6 21 V15.6 A2.4 2.4 0 0 1 14.4 15.6 V21" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Diana. Pestaña "Desafíos". */
export function IconTarget(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.6} {...s} />
      <Circle cx={12} cy={12} r={4.8} {...s} />
      <Circle cx={12} cy={12} r={1.5} {...s} fill={s.stroke} fillOpacity={1} />
    </Svg>
  );
}

/** Escudo con estrella. Pestaña "Ligas". */
export function IconShield(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M12 2.9 L19.3 5.5 V11.4 C19.3 16 16.2 19.8 12 21.1 C7.8 19.8 4.7 16 4.7 11.4 V5.5 Z" {...s} />
      <Path
        d="M12 8.3 l1.25 2.56 2.83 0.4 -2.04 1.98 0.48 2.81 -2.52 -1.32 -2.52 1.32 0.48 -2.81 -2.04 -1.98 2.83 -0.4 Z"
        {...s}
      />
    </Svg>
  );
}

/** Megáfono. Pestaña "Novedades". */
export function IconMegaphone(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M4.4 9.8 h3 L15.4 5 v14 L7.4 14.2 h-3 A1.6 1.6 0 0 1 2.8 12.6 v-1.2 A1.6 1.6 0 0 1 4.4 9.8 Z" {...s} />
      <Path d="M18.4 9.4 a4 4 0 0 1 0 5.2" {...s} fill="none" fillOpacity={0} />
      <Path d="M8 14.4 l0.9 4.1 a1.5 1.5 0 0 0 2.9 -0.6 l-0.6 -2.9" {...s} />
    </Svg>
  );
}

/** Destello de cuatro puntas. Pestaña "Súper". */
export function IconSparkle(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M12 3.4 c0.72 4.9 2.5 6.68 7.4 7.4 -4.9 0.72 -6.68 2.5 -7.4 7.4 -0.72 -4.9 -2.5 -6.68 -7.4 -7.4 4.9 -0.72 6.68 -2.5 7.4 -7.4 Z"
        {...s}
      />
    </Svg>
  );
}

/** Persona. Pestaña "Perfil". */
export function IconUser(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.2} r={4} {...s} />
      <Path d="M4.8 20.6 a7.2 7.2 0 0 1 14.4 0" {...s} />
    </Svg>
  );
}

/** Llama. Racha. */
export function IconFlame(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 c0 0 1.2 2.6 3.1 4.6 1.9 2 2.9 3.6 2.9 5.8 a6 6 0 0 1 -12 0 c0 -2 0.9 -3.6 2.2 -5 0.3 1.3 1 2 1.8 2.3 -0.5 -2.9 0.3 -5.5 2 -7.7 Z"
        {...s}
      />
    </Svg>
  );
}

/** Rayo. XP. */
export function IconBolt(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M13.4 2.6 L5.2 13.4 h5.1 l-1.1 8 8.6 -11.2 h-5.3 Z" {...s} />
    </Svg>
  );
}

/** Corazón. Vidas. */
export function IconHeart(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M12 20.8 C5.6 16.2 2.8 13.6 2.8 10.4 A4.8 4.8 0 0 1 7.6 5.6 c1.8 0 3.4 0.85 4.4 2.2 1 -1.35 2.6 -2.2 4.4 -2.2 a4.8 4.8 0 0 1 4.8 4.8 c0 3.2 -2.8 5.8 -9.2 10.4 Z"
        {...s}
      />
    </Svg>
  );
}

/** Flecha de avance. */
export function IconChevronRight(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M9.5 5.5 L16 12 l-6.5 6.5" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Señal caída. Errores de red. */
export function IconSignalOff(props: IconProps) {
  const s = iconStyle({ ...props, filled: false });
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M4.8 11.2 a10.2 10.2 0 0 1 5.2 -2.8" {...s} />
      <Path d="M14.6 8.6 a10.2 10.2 0 0 1 4.6 2.6" {...s} />
      <Path d="M8.2 14.7 a5.4 5.4 0 0 1 7.6 0" {...s} />
      <Circle cx={12} cy={18.4} r={1.1} fill={s.stroke} />
      <Path d="M3.4 3.4 L20.6 20.6" {...s} />
    </Svg>
  );
}

/** Controles deslizantes. Sección de desarrollo. */
export function IconSliders(props: IconProps) {
  const s = iconStyle({ ...props, filled: false });
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.4 7 h4.2" {...s} />
      <Path d="M11.8 7 h8.8" {...s} />
      <Path d="M3.4 12 h8.8" {...s} />
      <Path d="M16.4 12 h4.2" {...s} />
      <Path d="M3.4 17 h6.4" {...s} />
      <Path d="M14 17 h6.6" {...s} />
      <Circle cx={9.7} cy={7} r={2.1} {...s} fill={props.color ?? '#0F172A'} fillOpacity={0.18} />
      <Circle cx={14.3} cy={12} r={2.1} {...s} fill={props.color ?? '#0F172A'} fillOpacity={0.18} />
      <Circle cx={11.9} cy={17} r={2.1} {...s} fill={props.color ?? '#0F172A'} fillOpacity={0.18} />
    </Svg>
  );
}

/** Nota musical. Estados vacíos de contenido. */
export function IconMusicNote(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M9 17.6 V6.2 L19 4 v11.4" {...s} fill="none" fillOpacity={0} />
      <Circle cx={6.6} cy={17.6} r={2.6} {...s} />
      <Circle cx={16.6} cy={15.4} r={2.6} {...s} />
    </Svg>
  );
}

/** Reloj. Contenido que aún no está listo. */
export function IconClock(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.7} {...s} />
      <Path d="M12 7 V12.3 l3.4 2" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Birrete. Lecciones completadas. */
export function IconGraduation(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M2.8 9.4 L12 5.2 l9.2 4.2 -9.2 4.2 Z" {...s} />
      <Path d="M6.8 11.4 V15.7 c0 1.7 2.3 2.9 5.2 2.9 s5.2 -1.2 5.2 -2.9 V11.4" {...s} />
      <Path d="M21.2 9.4 V14" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Corona. Premium. */
export function IconCrown(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.4 17.6 V7.4 l4.7 3.5 L12 4.8 l3.9 6.1 4.7 -3.5 v10.2 Z" {...s} />
      <Path d="M6.2 20.6 h11.6" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Tarjeta. Gestión de la suscripción. */
export function IconCard(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.4 5.8 h17.2 a1.9 1.9 0 0 1 1.9 1.9 v8.6 a1.9 1.9 0 0 1 -1.9 1.9 H3.4 a1.9 1.9 0 0 1 -1.9 -1.9 V7.7 A1.9 1.9 0 0 1 3.4 5.8 Z" {...s} />
      <Path d="M1.5 10.4 h21" {...s} fill="none" fillOpacity={0} />
      <Path d="M5.6 14.6 h3.8" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Candado. Lecciones y unidades bloqueadas. */
export function IconLock(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M8 10.6 V7.8 a4 4 0 0 1 8 0 V10.6" {...s} fill="none" fillOpacity={0} />
      <Path d="M6.6 10.6 h10.8 a2 2 0 0 1 2 2 v6 a2.4 2.4 0 0 1 -2.4 2.4 H7 a2.4 2.4 0 0 1 -2.4 -2.4 v-6 a2 2 0 0 1 2 -2 Z" {...s} />
      <Path d="M12 14.6 v2.4" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Estrella redondeada. Lecciones completadas. */
export function IconStar(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M12 3.3 l2.55 5.2 5.7 0.83 -4.13 4.02 0.98 5.68 L12 16.35 l-5.1 2.68 0.98 -5.68 -4.13 -4.02 5.7 -0.83 Z"
        {...s}
      />
    </Svg>
  );
}

/** Micrófono. Lecciones que usan el micrófono. */
export function IconMic(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M12 3 a3.2 3.2 0 0 1 3.2 3.2 v5.2 a3.2 3.2 0 0 1 -6.4 0 V6.2 A3.2 3.2 0 0 1 12 3 Z" {...s} />
      <Path d="M5.8 11.2 a6.2 6.2 0 0 0 12.4 0" {...s} fill="none" fillOpacity={0} />
      <Path d="M12 17.4 V21" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Check. Tareas cumplidas y ventajas incluidas. */
export function IconCheck(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M5 12.6 l4.4 4.4 L19 7.4" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Trofeo. Ligas y clasificaciones. */
export function IconTrophy(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M7 3.8 h10 v5.4 a5 5 0 0 1 -10 0 Z" {...s} />
      <Path d="M7 5.6 H4.6 v1.6 a3.2 3.2 0 0 0 3 3.2" {...s} fill="none" fillOpacity={0} />
      <Path d="M17 5.6 h2.4 v1.6 a3.2 3.2 0 0 1 -3 3.2" {...s} fill="none" fillOpacity={0} />
      <Path d="M12 14.2 v3" {...s} fill="none" fillOpacity={0} />
      <Path d="M8.2 20.4 h7.6 l-0.8 -3.2 H9 Z" {...s} />
    </Svg>
  );
}

/** Regalo. Recompensas. */
export function IconGift(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M4.6 11 h14.8 v7.8 a2 2 0 0 1 -2 2 H6.6 a2 2 0 0 1 -2 -2 Z" {...s} />
      <Path d="M3.4 7.6 h17.2 V11 H3.4 Z" {...s} />
      <Path d="M12 7.6 V20.8" {...s} fill="none" fillOpacity={0} />
      <Path d="M12 7.6 C10.8 4.4 7.2 3.6 7.2 5.8 c0 1.4 2.4 1.8 4.8 1.8 2.4 0 4.8 -0.4 4.8 -1.8 0 -2.2 -3.6 -1.4 -4.8 1.8 Z" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Flecha de regreso. Botones de volver en cabeceras. */
export function IconArrowLeft(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M19.4 12 H5" {...s} fill="none" fillOpacity={0} />
      <Path d="M11 5.6 L4.6 12 l6.4 6.4" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Luna. Ajuste de modo oscuro. */
export function IconMoon(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M20.2 14.6 A8.4 8.4 0 1 1 9.4 3.8 a6.6 6.6 0 0 0 10.8 10.8 Z" {...s} />
    </Svg>
  );
}

/** Mapa plegado. Pestaña "Ruta". */
export function IconMap(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.4 6.2 L8.8 4 L15.2 6.4 L20.6 4.2 V17.8 L15.2 20 L8.8 17.6 L3.4 19.8 Z" {...s} />
      <Path d="M8.8 4 V17.6" {...s} fill="none" fillOpacity={0} />
      <Path d="M15.2 6.4 V20" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Lista con nota. Pestaña "Cursos". */
export function IconMusicList(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M3.6 6 h10" {...s} fill="none" fillOpacity={0} />
      <Path d="M3.6 10.6 h10" {...s} fill="none" fillOpacity={0} />
      <Path d="M3.6 15.2 h6" {...s} fill="none" fillOpacity={0} />
      <Path d="M17.4 16.6 V5 l3.2 1.4" {...s} fill="none" fillOpacity={0} />
      <Circle cx={15.2} cy={17.4} r={2.4} {...s} />
    </Svg>
  );
}

/** Cara sonriente. Pestaña "Perfil". */
export function IconFace(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.8} {...s} />
      <Circle cx={9.2} cy={10.4} r={1.1} fill={s.stroke} />
      <Circle cx={14.8} cy={10.4} r={1.1} fill={s.stroke} />
      <Path d="M8.8 14.4 a3.8 3.8 0 0 0 6.4 0" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Libro abierto. Guía de la unidad. */
export function IconBook(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M12 6.4 C10 5 6.8 4.6 3.4 5.2 V18.4 C6.8 17.8 10 18.2 12 19.6 Z" {...s} />
      <Path d="M12 6.4 C14 5 17.2 4.6 20.6 5.2 V18.4 C17.2 17.8 14 18.2 12 19.6 Z" {...s} />
    </Svg>
  );
}

/** Triángulo de reproducir. */
export function IconPlay(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M8 5.4 L18.6 12 L8 18.6 Z" {...s} />
    </Svg>
  );
}

/** Campana. Avisos. */
export function IconBell(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M6.2 16.6 V11 a5.8 5.8 0 0 1 11.6 0 v5.6 l1.6 1.8 H4.6 Z" {...s} />
      <Path d="M10 20.6 a2.2 2.2 0 0 0 4 0" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Compartir (tres nodos). */
export function IconShare(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={17.6} cy={5.8} r={2.6} {...s} />
      <Circle cx={6.4} cy={12} r={2.6} {...s} />
      <Circle cx={17.6} cy={18.2} r={2.6} {...s} />
      <Path d="M8.7 10.7 l6.6 -3.6" {...s} fill="none" fillOpacity={0} />
      <Path d="M8.7 13.3 l6.6 3.6" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Engranaje. Ajustes. */
export function IconSettings(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M10.4 3 h3.2 l0.5 2.3 1.7 0.9 2.2 -0.9 1.6 2.8 -1.8 1.6 v1.9 l1.8 1.6 -1.6 2.8 -2.2 -0.9 -1.7 0.9 -0.5 2.3 h-3.2 l-0.5 -2.3 -1.7 -0.9 -2.2 0.9 -1.6 -2.8 1.8 -1.6 v-1.9 l-1.8 -1.6 1.6 -2.8 2.2 0.9 1.7 -0.9 Z"
        {...s}
      />
      <Circle cx={12} cy={11.6} r={2.8} {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Calendario. */
export function IconCalendar(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path d="M5.6 5.4 h12.8 a2 2 0 0 1 2 2 v11 a2 2 0 0 1 -2 2 H5.6 a2 2 0 0 1 -2 -2 v-11 a2 2 0 0 1 2 -2 Z" {...s} />
      <Path d="M3.6 10 h16.8" {...s} fill="none" fillOpacity={0} />
      <Path d="M8.4 3.4 v3.8" {...s} fill="none" fillOpacity={0} />
      <Path d="M15.6 3.4 v3.8" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Círculo tachado. "Sin anuncios". */
export function IconBlock(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.6} {...s} />
      <Path d="M5.9 5.9 L18.1 18.1" {...s} fill="none" fillOpacity={0} />
    </Svg>
  );
}

/** Ojo abierto. Mostrar contraseña. */
export function IconEye(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M1.5 12 C4.5 6 8 3.5 12 3.5 C16 3.5 19.5 6 22.5 12 C19.5 18 16 20.5 12 20.5 C8 20.5 4.5 18 1.5 12 Z"
        {...s}
      />
      <Circle cx={12} cy={12} r={3.2} {...s} />
    </Svg>
  );
}

/** Ojo tachado. Ocultar contraseña. */
export function IconEyeOff(props: IconProps) {
  const s = iconStyle(props);
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24">
      <Path
        d="M3 3 L21 21"
        fill="none"
        fillOpacity={0}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M10.6 5.1 C11.05 4.87 11.52 4.72 12 4.72 C16 4.72 19.5 7.22 22.5 12 C21.6 13.5 20.6 14.8 19.5 15.85 M14.8 14.8 A3.2 3.2 0 0 1 9.2 9.2 M6.8 6.8 C5.4 7.9 4.1 9.3 3 11.5 C5.5 16.5 8.7 19.28 12 19.28 C13.6 19.28 15.2 18.6 16.7 17.5"
        fill="none"
        fillOpacity={0}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
