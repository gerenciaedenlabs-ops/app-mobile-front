/**
 * Contenido de relleno para las pestañas que todavía no tienen endpoint
 * (Desafíos, Ligas y Novedades). Vive aquí, y no dentro de cada
 * pantalla, para que conectar la API sea cambiar esta fuente y nada más.
 *
 * TODO(api): reemplazar por datos del backend cuando existan los endpoints.
 */

export interface DailyQuest {
  id: string;
  title: string;
  current: number;
  target: number;
  rewardXp: number;
}

export interface MonthlyChallenge {
  title: string;
  description: string;
  current: number;
  target: number;
  daysLeft: number;
}

export interface LeagueRival {
  id: string;
  username: string;
  weeklyXp: number;
  /** Color del avatar con la inicial. */
  color: string;
}

export interface League {
  name: string;
  color: string;
  daysLeft: number;
  /** Cuántos puestos suben y bajan de liga al cerrar la semana. */
  promotionSlots: number;
  demotionSlots: number;
}

export type NewsTag = 'Nuevo' | 'Consejo' | 'Evento' | 'Actualización';

export interface NewsItem {
  id: string;
  tag: NewsTag;
  title: string;
  body: string;
  date: string;
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'q-xp', title: 'Gana 30 XP', current: 20, target: 30, rewardXp: 10 },
  { id: 'q-lessons', title: 'Completa 2 lecciones', current: 1, target: 2, rewardXp: 10 },
  { id: 'q-perfect', title: 'Haz una lección sin errores', current: 0, target: 1, rewardXp: 15 },
];

export const MONTHLY_CHALLENGE: MonthlyChallenge = {
  title: 'Maratón de septiembre',
  description: 'Completa 30 misiones diarias este mes y gana la insignia de Constancia.',
  current: 12,
  target: 30,
  daysLeft: 12,
};

export const CURRENT_LEAGUE: League = {
  name: 'Liga Ámbar',
  color: '#D97706',
  daysLeft: 3,
  promotionSlots: 3,
  demotionSlots: 3,
};

export const LEAGUE_RIVALS: LeagueRival[] = [
  { id: 'r1', username: 'valen.piano', weeklyXp: 412, color: '#EC4899' },
  { id: 'r2', username: 'santi_drums', weeklyXp: 368, color: '#0EA5E9' },
  { id: 'r3', username: 'mariacanta', weeklyXp: 301, color: '#8B5CF6' },
  { id: 'r4', username: 'juanjo.gtr', weeklyXp: 254, color: '#10B981' },
  { id: 'r5', username: 'lau_ukulele', weeklyXp: 190, color: '#F97316' },
  { id: 'r6', username: 'dani.bajo', weeklyXp: 142, color: '#6366F1' },
  { id: 'r7', username: 'camila.voz', weeklyXp: 96, color: '#14B8A6' },
  { id: 'r8', username: 'nico_beats', weeklyXp: 58, color: '#EF4444' },
  { id: 'r9', username: 'sofi.keys', weeklyXp: 21, color: '#84CC16' },
];

export const NEWS: NewsItem[] = [
  {
    id: 'n1',
    tag: 'Nuevo',
    title: 'Llega el curso de batería',
    body: 'Aprende ritmos básicos, rellenos y a tocar con metrónomo. Las primeras unidades ya están disponibles.',
    date: '16 sep',
  },
  {
    id: 'n2',
    tag: 'Consejo',
    title: 'Afina antes de practicar',
    body: 'Unos segundos con el afinador hacen que la detección de notas sea mucho más precisa en tus lecciones.',
    date: '14 sep',
  },
  {
    id: 'n3',
    tag: 'Evento',
    title: 'Semana doble de XP',
    body: 'Del 22 al 28 de septiembre todas las lecciones completadas dan el doble de experiencia.',
    date: '12 sep',
  },
  {
    id: 'n4',
    tag: 'Actualización',
    title: 'Mejor detección de voz',
    body: 'Ajustamos el motor de afinación para que reconozca mejor las notas graves y los cambios rápidos.',
    date: '8 sep',
  },
];

