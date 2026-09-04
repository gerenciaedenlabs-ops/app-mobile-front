/**
 * Fechas en hora LOCAL del dispositivo.
 *
 * La racha se rompe según el calendario del usuario, no según UTC: usar
 * `toISOString()` aquí introduce un desfase de un día en medio mundo.
 */
import type { DayKey } from '@/types/progress';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Date → "YYYY-MM-DD" en hora local. */
export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

/** "YYYY-MM-DD" → Date a medianoche local. Devuelve null si la clave es inválida. */
export function fromDayKey(key: DayKey): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Días completos entre dos claves (b - a). 1 significa que `b` es el día
 * siguiente a `a`. Devuelve null si alguna clave es inválida.
 */
export function daysBetween(a: DayKey, b: DayKey): number | null {
  const dateA = fromDayKey(a);
  const dateB = fromDayKey(b);
  if (!dateA || !dateB) return null;
  // Normalizado a mediodía para que los cambios de horario de verano no
  // conviertan una diferencia de 1 día en 0.96.
  dateA.setHours(12, 0, 0, 0);
  dateB.setHours(12, 0, 0, 0);
  return Math.round((dateB.getTime() - dateA.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/**
 * Rejilla del mes que contiene `reference`, alineada a semanas que empiezan
 * en lunes. Las celdas fuera del mes son null.
 */
export function getMonthGrid(reference: Date = new Date()): (DayKey | null)[][] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0 = domingo. Se desplaza para que 0 = lunes.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells: (DayKey | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toDayKey(new Date(year, month, index + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayKey | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

export function formatMonthLabel(reference: Date = new Date()): string {
  return reference.toLocaleDateString('es', { month: 'long', year: 'numeric' });
}

/** "2h 15m", "45m", "30s" — para el contador de regeneración de vidas. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}
