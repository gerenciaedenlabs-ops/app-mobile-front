import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const submit = async () => {
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

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center"
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
          <Text className="mt-1 text-sm text-ink-muted">Usa tu correo o nombre de usuario.</Text>

          <Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-ink-muted">
            Correo o usuario
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            editable={!isLoggingIn}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            placeholder="ana o ana@edenship.test"
            className="h-14 rounded-2xl border-2 border-slate-200 bg-surface-sunken px-4 text-base text-ink"
          />

          <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-ink-muted">
            Contraseña
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            editable={!isLoggingIn}
            secureTextEntry
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            placeholder="Tu contraseña"
            className="h-14 rounded-2xl border-2 border-slate-200 bg-surface-sunken px-4 text-base text-ink"
          />

          {error ? <Text className="mt-3 text-sm font-semibold text-danger">{error}</Text> : null}

          <Button
            label={isLoggingIn ? 'Iniciando…' : 'Entrar'}
            disabled={isLoggingIn}
            onPress={() => void submit()}
            className="mt-6"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
