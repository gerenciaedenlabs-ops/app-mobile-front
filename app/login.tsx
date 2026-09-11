import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = Platform.select({
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});
const missingGoogleClientId = 'google-oauth-not-configured.apps.googleusercontent.com';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledGoogleToken = useRef<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest(
    {
      clientId: googleClientId ?? missingGoogleClientId,
      scopes: ['openid', 'email', 'profile'],
      selectAccount: true,
    },
    { scheme: 'edenship', path: 'oauth/google' },
  );

  useEffect(() => {
    if (!googleResponse) return;

    setIsOpeningGoogle(false);
    if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') return;
    if (googleResponse.type !== 'success') {
      const googleError =
        googleResponse.type === 'error' ? googleResponse.error?.message : undefined;
      setError(googleError ?? 'Google no pudo completar el inicio de sesión.');
      return;
    }

    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      setError('Google no devolvió una identidad válida.');
      return;
    }
    if (handledGoogleToken.current === idToken) return;
    handledGoogleToken.current = idToken;

    setError(null);
    void loginWithGoogle(idToken).catch((cause: unknown) => {
      handledGoogleToken.current = null;
      setError(cause instanceof ApiError ? cause.message : 'No se pudo iniciar sesión con Google.');
    });
  }, [googleResponse, loginWithGoogle]);

  const startGoogleLogin = async () => {
    if (!googleClientId) {
      const platformVariable = Platform.select({
        android: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
        ios: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
        default: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
      });
      setError(`Configura ${platformVariable} para habilitar Google.`);
      return;
    }

    setError(null);
    setIsOpeningGoogle(true);
    try {
      await promptGoogle();
    } catch {
      setIsOpeningGoogle(false);
      setError('No se pudo abrir Google. Inténtalo nuevamente.');
    }
  };

  const submitEmailLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Ingresa tu correo o usuario y contraseña.');
      return;
    }
    setError(null);
    try {
      await login(identifier, password);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'No se pudo iniciar sesión.');
    }
  };

  const busy = isLoggingIn || isOpeningGoogle;

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center py-8"
      >
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
            <Text className="text-4xl">🎵</Text>
          </View>
          <Text className="mt-5 text-4xl font-extrabold text-ink">EdenShip</Text>
          <Text className="mt-2 text-center text-sm text-ink-muted">
            Aprende música, una lección a la vez.
          </Text>
        </View>

        <View className="mt-8 rounded-3xl bg-white p-5">
          <Text className="text-2xl font-extrabold text-ink">Iniciar sesión</Text>
          <Text className="mt-1 text-sm text-ink-muted">Continúa con tu cuenta de Google.</Text>

          <Button
            label={isOpeningGoogle || isLoggingIn ? 'Conectando…' : 'Continuar con Google'}
            icon="G"
            variant="secondary"
            disabled={!googleRequest || busy}
            onPress={() => void startGoogleLogin()}
            className="mt-6"
            accessibilityHint="Abre Google para elegir una cuenta"
          />

          <View className="my-5 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-muted">o</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>

          <Button
            label={showEmailLogin ? 'Ocultar acceso por correo' : 'Continuar con correo'}
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setShowEmailLogin((visible) => !visible);
              setError(null);
            }}
          />

          {showEmailLogin ? (
            <View className="mt-2">
              <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Correo o usuario
              </Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                placeholder="deymer o deymer@edenship.test"
                className="h-14 rounded-2xl border-2 border-slate-200 bg-surface-sunken px-4 text-base text-ink"
              />

              <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Contraseña
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                editable={!busy}
                secureTextEntry
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void submitEmailLogin()}
                placeholder="Tu contraseña"
                className="h-14 rounded-2xl border-2 border-slate-200 bg-surface-sunken px-4 text-base text-ink"
              />

              <Button
                label={isLoggingIn ? 'Iniciando…' : 'Entrar con correo'}
                disabled={busy}
                onPress={() => void submitEmailLogin()}
                className="mt-6"
              />
            </View>
          ) : null}

          {error ? <Text className="mt-4 text-sm font-semibold text-danger">{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
