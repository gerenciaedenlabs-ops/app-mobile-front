/**
 * El backend no manda ícono, color de acento ni tagline por instrumento
 * (`iconUrl` es siempre null hoy). Esta tabla local solo pone la piel encima
 * del id/slug/name/order reales que sí vienen de la API.
 */
import type { InstrumentSlug } from '@/types/content';

interface InstrumentPresentation {
  icon: string;
  accentColor: string;
  tagline: string;
}

const PRESENTATION_BY_SLUG: Record<InstrumentSlug, InstrumentPresentation> = {
  guitar: { icon: '🎸', accentColor: '#EA580C', tagline: 'Acordes, afinación y oído.' },
  piano: { icon: '🎹', accentColor: '#6D28D9', tagline: 'Notas, ritmo y teoría básica.' },
  drums: { icon: '🥁', accentColor: '#0891B2', tagline: 'Ritmo y coordinación.' },
  vocals: { icon: '🎤', accentColor: '#DB2777', tagline: 'Afinación y control vocal.' },
};

const FALLBACK_PRESENTATION: InstrumentPresentation = {
  icon: '🎵',
  accentColor: '#475569',
  tagline: 'Nuevo curso.',
};

function isKnownSlug(slug: string): slug is InstrumentSlug {
  return Object.prototype.hasOwnProperty.call(PRESENTATION_BY_SLUG, slug);
}

export function getInstrumentPresentation(slug: string): InstrumentPresentation {
  return isKnownSlug(slug) ? PRESENTATION_BY_SLUG[slug] : FALLBACK_PRESENTATION;
}
