import { type Href, useRouter } from 'expo-router';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { IconCard, IconCrown, IconMoon } from '@/components/icons';
import { presentCustomerCenter } from '@/lib/purchases';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeColors, useThemeStore } from '@/store/themeStore';

/**
 * Ajustes y cuenta. El diseño de Perfil (Diseno Nuevo/perfil) solo muestra el
 * engranaje; estas acciones reales viven aquí para no perderlas.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const darkMode = useThemeStore((state) => state.darkMode);
  const setDarkMode = useThemeStore((state) => state.setDarkMode);

  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const isDeletingAccount = useAuthStore((state) => state.isDeletingAccount);
  const isPremium = useProgressStore((state) => state.isPremium);
  const resetProgress = useProgressStore((state) => state.resetProgress);

  const confirmReset = () => {
    Alert.alert('Reiniciar progreso', 'Se borrarán XP, racha y lecciones completadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: resetProgress },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Borrar cuenta',
      'Se eliminará todo: tu cuenta, perfil, acceso con Google y progreso. Esta acción no se puede deshacer. ¿Seguro que quieres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar cuenta',
          style: 'destructive',
          onPress: () => {
            void deleteAccount()
              .then(() => router.replace('/login' as Href))
              .catch((error: unknown) => {
                Alert.alert(
                  'No se pudo borrar la cuenta',
                  error instanceof Error ? error.message : 'Inténtalo nuevamente.',
                );
              });
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-2xl font-extrabold text-ink">Configuración</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <Text className="text-base font-bold text-ink-soft">✕</Text>
        </Pressable>
      </View>

      <Text className="mb-3 mt-4 text-xs font-extrabold uppercase tracking-wider text-ink-soft">Apariencia</Text>
      <View className="flex-row items-center gap-3 rounded-2xl border border-line border-b-4 bg-surface p-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
          <IconMoon size={20} color={colors.brandInk} filled />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-ink">Modo oscuro</Text>
          <Text className="mt-0.5 text-xs font-medium text-ink-muted">
            Fondo gris oscuro, ideal para practicar de noche.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Modo oscuro"
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: colors.line, true: colors.brand }}
          ios_backgroundColor={colors.line}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wider text-ink-soft">Suscripción</Text>
      {!isPremium ? (
        <Button
          label="Hazte Premium"
          icon={<IconCrown size={20} color="#FFFFFF" filled />}
          onPress={() => router.push('/paywall')}
        />
      ) : (
        <Button
          label="Gestionar suscripción"
          icon={<IconCard size={20} color={colors.ink} />}
          variant="secondary"
          onPress={() => void presentCustomerCenter()}
          accessibilityHint="Abre el centro de ayuda y gestión de suscripción de RevenueCat"
        />
      )}

      <Text className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wider text-ink-soft">Cuenta</Text>
      <View className="gap-3">
        {/* Atajo de desarrollo: no debería llegar a producción tal cual. */}
        <Button label="Reiniciar progreso" variant="ghost" onPress={confirmReset} />
        <Button
          label="Cerrar sesión"
          variant="secondary"
          disabled={isDeletingAccount}
          onPress={() => {
            logout();
            router.replace('/login' as Href);
          }}
        />
        <Button
          label={isDeletingAccount ? 'Borrando cuenta…' : 'Borrar cuenta'}
          variant="danger"
          disabled={isDeletingAccount}
          onPress={confirmDeleteAccount}
          accessibilityHint="Elimina definitivamente tu cuenta y toda su información"
        />
      </View>
    </Screen>
  );
}
