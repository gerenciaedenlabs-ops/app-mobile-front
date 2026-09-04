type ClassValue = string | false | null | undefined;

/** Une clases de NativeWind ignorando ramas falsy. */
export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}
