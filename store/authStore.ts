import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ApiError, apiRequest } from '@/lib/api';

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
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      isLoggingIn: false,

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

      logout: () => set({ token: null, user: null, isLoggingIn: false }),
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
