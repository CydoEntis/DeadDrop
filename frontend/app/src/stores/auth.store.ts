/*
 * Auth Store - Global authentication state managed by Zustand
 *
 * This store holds the current user, access token, and auth status.
 * It persists to localStorage (key: "auth-storage") so users stay logged in
 * across page refreshes and browser restarts.
 *
 * USAGE:
 * - In React components: const { user, isAuthenticated } = useAuthStore()
 * - Outside React (e.g., api-client.ts): useAuthStore.getState().accessToken
 *
 * PERSISTENCE:
 * - Only user, accessToken, and isAuthenticated are persisted (via partialize)
 * - isLoading is NOT persisted (always starts as false on page load)
 * - clearAuth() also removes the CSRF token from localStorage
 *
 * CUSTOMIZATION:
 * - Add fields to the User interface to match your backend's user model
 * - Add new actions to AuthState for additional auth flows
 * - Change the storage key on the `name` property if you run multiple apps on localhost
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  roles: string[];
  isEmailVerified: boolean;
  hasPassword: boolean;
  requiresEmailVerification?: boolean;
  isDemoAccount?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Called after successful login or registration
      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false
        });
      },

      // Called after a silent token refresh (only updates the token, not the user)
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      // Called when profile data is refreshed from the server
      setUser: (user) => {
        set({ user, isLoading: false });
      },

      // Called on logout or when auth fails - clears everything including CSRF
      clearAuth: () => {
        localStorage.removeItem('csrfToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // localStorage key - change if running multiple apps on localhost
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
