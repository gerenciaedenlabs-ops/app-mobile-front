import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ApiError, apiRequest } from '@/lib/api';
import { unloadProgressUser } from '@/store/progressStore';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  isLoggingIn: boolean;
  isDeletingAccount: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      isLoggingIn: false,
      isDeletingAccount: false,

      login: async (identifier, password) => {
        set({ isLoggingIn: true });
        try {
          const session = await apiRequest<LoginResponse>('auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier: identifier.trim(), password }),
          });
          set({ token: session.token, user: session.user, isLoggingIn: false });
        } catch (error) {
          set({ isLoggingIn: false });
          throw error;
        }
      },

      loginWithGoogle: async (idToken) => {
        set({ isLoggingIn: true });
        try {
          const session = await apiRequest<LoginResponse>('auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          });
          set({ token: session.token, user: session.user, isLoggingIn: false });
        } catch (error) {
          set({ isLoggingIn: false });
          throw error;
        }
      },

      deleteAccount: async () => {
        const { token, user } = useAuthStore.getState();
        if (!token || !user) throw new ApiError('No hay una sesión activa.', 401);

        set({ isDeletingAccount: true });
        try {
          await apiRequest<{ deleted: true }>('auth/account', {
            method: 'DELETE',
            token,
            body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
          });
          await AsyncStorage.removeItem(`edenship-progress:${user.id}`).catch(() => undefined);
          unloadProgressUser();
          set({ token: null, user: null, isLoggingIn: false, isDeletingAccount: false });
        } catch (error) {
          set({ isDeletingAccount: false });
          throw error;
        }
      },

      logout: () =>
        set({ token: null, user: null, isLoggingIn: false, isDeletingAccount: false }),
    }),
    {
      name: 'edenship-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ token, user }) => ({ token, user }) as AuthStore,
      onRehydrateStorage: () => (state) => {
        if (!state?.token || !state.user) {
          useAuthStore.setState({ token: null, user: null, hasHydrated: true });
          return;
        }

        void apiRequest<MeResponse>('auth/me', { token: state.token })
          .then(({ user }) => useAuthStore.setState({ user }))
          .catch((error: unknown) => {
            // Una caída de red no debe sacar al alumno. Un token rechazado sí.
            if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
              useAuthStore.setState({ token: null, user: null });
            }
          })
          .finally(() => useAuthStore.setState({ hasHydrated: true }));
      },
    },
  ),
);
