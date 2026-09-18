import type { ComponentType } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import {
  type IconProps,
  IconMegaphone,
  IconMusicNote,
  IconSignalOff,
  IconSparkle,
  IconStar,
  IconTrophy,
} from '@/components/icons';
import { useNews } from '@/hooks/useContent';
import { formatShortDate } from '@/lib/datetime';
import type { ThemeColors } from '@/lib/theme';
import { useThemeColors } from '@/store/themeStore';
import type { ApiNewsItem } from '@/types/api';

/**
 * Apariencia por tag. El backend confirmó que `tag` es texto libre (sin
 * catálogo fijo), así que cualquier valor fuera de estos 4 cae en DEFAULT_TAG_STYLE
 * en vez de romper.
 */
const TAG_STYLE: Record<string, { color: keyof ThemeColors; Icon: ComponentType<IconProps> }> = {
  Nuevo: { color: 'brand', Icon: IconMusicNote },
  Consejo: { color: 'devAccent', Icon: IconStar },
  Evento: { color: 'warning', Icon: IconTrophy },
  Actualización: { color: 'success', Icon: IconSparkle },
};
const DEFAULT_TAG_STYLE = { color: 'inkMuted' as const, Icon: IconMegaphone };

function NewsCard({ item }: { item: ApiNewsItem }) {
  const colors = useThemeColors();
  const style = TAG_STYLE[item.tag] ?? DEFAULT_TAG_STYLE;
  const { Icon } = style;
  const color = colors[style.color];

  return (
    <View className="rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View
          style={{ backgroundColor: `${color}1A` }}
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
        >
          <Icon size={14} color={color} filled />
          <Text style={{ color }} className="text-[11px] font-extrabold uppercase tracking-wide">
            {item.tag}
          </Text>
        </View>
        <Text className="text-xs text-ink-muted">{formatShortDate(item.publishedAt)}</Text>
      </View>
      <Text className="mt-3 text-base font-extrabold text-ink">{item.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-ink-soft">{item.body}</Text>
    </View>
  );
}

export default function NewsScreen() {
  const colors = useThemeColors();
  const news = useNews();

  return (
    <Screen scroll edges={['top']}>
      <View className="flex-row items-center gap-2 py-2">
        <IconMegaphone size={24} color={colors.brand} filled />
        <Text className="text-2xl font-extrabold text-ink">Novedades</Text>
      </View>
      <Text className="text-xs text-ink-muted">Lo último de Ritmo: cursos, eventos y consejos.</Text>

      {news.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : news.status === 'error' ? (
        <EmptyState
          icon={<IconSignalOff size={40} color={colors.inkMuted} />}
          title="No se pudieron cargar las novedades"
          description={news.error?.message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
          className="mt-4"
        />
      ) : (news.data ?? []).length === 0 ? (
        <EmptyState
          icon={<IconMegaphone size={40} color={colors.inkMuted} />}
          title="Sin novedades por ahora"
          description="Vuelve pronto para ver las últimas noticias."
          className="mt-4"
        />
      ) : (
        <View className="mt-4 gap-3">
          {(news.data ?? []).map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </Screen>
  );
}
