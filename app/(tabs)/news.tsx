import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  type IconProps,
  IconMegaphone,
  IconMusicNote,
  IconSparkle,
  IconStar,
  IconTrophy,
} from '@/components/icons';
import { NEWS, type NewsItem, type NewsTag } from '@/lib/mockContent';
import type { ThemeColors } from '@/lib/theme';
import { useThemeColors } from '@/store/themeStore';

/** Apariencia de cada tipo de novedad. El color sale del tema activo. */
const TAG_STYLE: Record<NewsTag, { color: keyof ThemeColors; Icon: ComponentType<IconProps> }> = {
  Nuevo: { color: 'brand', Icon: IconMusicNote },
  Consejo: { color: 'devAccent', Icon: IconStar },
  Evento: { color: 'warning', Icon: IconTrophy },
  Actualización: { color: 'success', Icon: IconSparkle },
};

function NewsCard({ item }: { item: NewsItem }) {
  const colors = useThemeColors();
  const { Icon } = TAG_STYLE[item.tag];
  const color = colors[TAG_STYLE[item.tag].color];

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
        <Text className="text-xs text-ink-muted">{item.date}</Text>
      </View>
      <Text className="mt-3 text-base font-extrabold text-ink">{item.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-ink-soft">{item.body}</Text>
    </View>
  );
}

export default function NewsScreen() {
  const colors = useThemeColors();
  return (
    <Screen scroll edges={['top']}>
      <View className="flex-row items-center gap-2 py-2">
        <IconMegaphone size={24} color={colors.brand} filled />
        <Text className="text-2xl font-extrabold text-ink">Novedades</Text>
      </View>
      <Text className="text-xs text-ink-muted">Lo último de Ritmo: cursos, eventos y consejos.</Text>

      <View className="mt-4 gap-3">
        {NEWS.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </View>
    </Screen>
  );
}
