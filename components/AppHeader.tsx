import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconBolt, IconCheck, IconChevronRight, IconFlame, IconHeart, IconMusicList } from '@/components/icons';
import { cn } from '@/lib/cn';
import { todayKey } from '@/lib/datetime';
import { getEffectiveStreak } from '@/lib/streak';
import { GAME_COLORS } from '@/lib/theme';
import { useProgressStore } from '@/store/progressStore';
import { useThemeColors } from '@/store/themeStore';
import type { Instrument } from '@/types/content';

interface AppHeaderProps {
  /**
   * Instrumento en curso. Si se pasa, aparece el selector desplegable.
   * Lo recibe de la pantalla (que ya cargó los instrumentos) para no repetir
   * la petición en cada pestaña.
   */
  instrument?: Instrument | null;
  /** Instrumentos entre los que se puede cambiar desde el desplegable. */
  instruments?: readonly Instrument[] | null;
  /** Variante de Planes: mascota + logotipo a la izquierda y sin avatar. */
  variant?: 'default' | 'plans';
}

function StatBubble({ icon, value, textColor }: { icon: ReactNode; value: number; textColor: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-line border-b-2 bg-surface px-2 py-1">
      {icon}
      <Text style={{ color: textColor }} className="text-xs font-extrabold">
        {value}
      </Text>
    </View>
  );
}

/** Alto de la barra (h-16): el desplegable se abre justo debajo. */
const HEADER_HEIGHT = 64;

interface InstrumentPickerProps {
  current: Instrument;
  instruments: readonly Instrument[];
}

/** Selector de instrumento: la píldora abre una lista para cambiar de curso. */
function InstrumentPicker({ current, instruments }: InstrumentPickerProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const setLastInstrument = useProgressStore((state) => state.setLastInstrument);
  const [open, setOpen] = useState(false);

  const choose = (instrumentId: string) => {
    setOpen(false);
    if (instrumentId !== current.id) setLastInstrument(instrumentId);
    router.navigate('/(tabs)/ruta');
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Curso actual: ${current.name}. Cambiar curso`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        hitSlop={6}
        className="h-9 flex-shrink flex-row items-center gap-1.5 rounded-full border border-line border-b-2 bg-surface px-2.5 active:translate-y-px"
      >
        <Text className="text-sm">{current.icon}</Text>
        <Text numberOfLines={1} className="flex-shrink text-xs font-extrabold uppercase text-ink">
          {current.name}
        </Text>
        <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
          <IconChevronRight size={14} color={colors.inkMuted} strokeWidth={2.4} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Fondo: tocar fuera de la lista la cierra. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector de curso"
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/20"
        >
          {/* Absorbe los toques dentro de la lista para que no la cierre el fondo. */}
          <Pressable
            onPress={() => undefined}
            style={{ top: insets.top + HEADER_HEIGHT - 6 }}
            className="absolute left-4 w-64 overflow-hidden rounded-2xl border-2 border-line border-b-4 bg-surface"
          >
            <Text className="px-4 pb-1 pt-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
              Cambiar de curso
            </Text>
            {instruments.map((item) => {
              const selected = item.id === current.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => choose(item.id)}
                  className={cn(
                    'flex-row items-center gap-3 px-4 py-3 active:bg-surface-raised',
                    selected && 'bg-brand-soft',
                  )}
                >
                  <Text className="text-xl">{item.icon}</Text>
                  <Text
                    numberOfLines={1}
                    className={cn('flex-1 text-[15px] font-bold', selected ? 'text-brand-ink' : 'text-ink')}
                  >
                    {item.name}
                  </Text>
                  {selected ? <IconCheck size={18} color={colors.brandInk} strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="menuitem"
              onPress={() => {
                setOpen(false);
                router.navigate('/(tabs)/courses');
              }}
              className="flex-row items-center gap-3 border-t border-line px-4 py-3 active:bg-surface-raised"
            >
              <IconMusicList size={20} color={colors.inkMuted} />
              <Text className="text-[13px] font-bold text-ink-soft">Ver todos los cursos</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Barra superior compartida por las pestañas (Diseno Nuevo: header fijo). */
export function AppHeader({ instrument, instruments, variant = 'default' }: AppHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const xp = useProgressStore((state) => state.xp);
  const hearts = useProgressStore((state) => state.hearts);
  const streak = useProgressStore((state) => state.streak);
  const currentStreak = getEffectiveStreak(streak, todayKey());

  return (
    <View className="h-16 flex-row items-center justify-between gap-2 border-b border-line bg-surface-sunken px-4">
      <View className="flex-shrink flex-row items-center gap-2">
        {variant === 'plans' ? (
          <Image
            source={require('@/assets/brand/mascot.png')}
            accessibilityIgnoresInvertColors
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        ) : null}
        <Image
          source={require('@/assets/brand/wordmark.png')}
          accessibilityRole="header"
          accessibilityLabel="Ritmo"
          style={{ width: 58, height: 28 }}
          resizeMode="contain"
        />

        {variant === 'default' && instrument ? (
          <InstrumentPicker current={instrument} instruments={instruments?.length ? instruments : [instrument]} />
        ) : null}
      </View>

      <View className="flex-row items-center gap-1.5">
        <StatBubble
          icon={<IconFlame size={14} color={GAME_COLORS.flame.fill} filled />}
          value={currentStreak}
          textColor={colors.warning}
        />
        <StatBubble icon={<IconBolt size={14} color="#F4BF00" filled />} value={xp} textColor={colors.warning} />
        <StatBubble
          icon={<IconHeart size={14} color={colors.danger} filled />}
          value={hearts.current}
          textColor={colors.danger}
        />
        {variant === 'default' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={() => router.navigate('/(tabs)/profile')}
            className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-brand bg-surface"
          >
            <Image
              source={require('@/assets/brand/app-icon.png')}
              accessibilityIgnoresInvertColors
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
