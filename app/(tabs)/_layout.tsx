import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconFace, IconMap, IconMusicList, IconStar, IconTrophy } from '@/components/icons';
import { useThemeColors } from '@/store/themeStore';

/** Alto útil de la barra, sin contar el área segura del dispositivo. */
const BAR_HEIGHT = 68;
/** Relleno inferior en aparatos sin indicador de inicio (Android, iPhone SE). */
const FALLBACK_BOTTOM_PADDING = 14;

const ICON_SIZE = 26;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  // En iPhone con indicador de inicio hay que sumar el área segura al alto de la
  // barra. Sin esto los iconos quedan hundidos contra el borde de la pantalla.
  const bottomPadding = insets.bottom > 0 ? insets.bottom : FALLBACK_BOTTOM_PADDING;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceSunken,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          height: BAR_HEIGHT + insets.bottom,
          paddingTop: 12,
          paddingBottom: bottomPadding,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'NunitoSans_800ExtraBold', marginTop: 6 },
        tabBarActiveTintColor: colors.brandInk,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      {/* Orden y pestañas del diseño (Diseno Nuevo): Ruta, Cursos, Desafíos, Súper, Perfil. */}
      <Tabs.Screen
        name="ruta"
        options={{
          title: 'Ruta',
          tabBarIcon: ({ color, focused }) => <IconMap color={color} filled={focused} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color, focused }) => (
            <IconMusicList color={color} filled={focused} size={ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Desafíos',
          tabBarIcon: ({ color, focused }) => <IconTrophy color={color} filled={focused} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="super"
        options={{
          title: 'Súper',
          tabBarIcon: ({ color, focused }) => <IconStar color={color} filled={focused} size={ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <IconFace color={color} filled={focused} size={ICON_SIZE} />,
        }}
      />
      {/*
        Ligas, Novedades, Clanes y Tienda no están en el diseño nuevo (Daniel
        no definió dónde entran en la IA todavía). Se conservan las pantallas
        pero `href: null` las saca de la barra hasta que se decida.
      */}
      <Tabs.Screen name="leagues" options={{ href: null, title: 'Ligas' }} />
      <Tabs.Screen name="news" options={{ href: null, title: 'Novedades' }} />
      <Tabs.Screen name="clubs" options={{ href: null, title: 'Clanes' }} />
      <Tabs.Screen name="shop" options={{ href: null, title: 'Tienda' }} />
    </Tabs>
  );
}
