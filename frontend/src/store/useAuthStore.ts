import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  role: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  accessToken: localStorage.getItem('access_token'),

  login: (access, refresh, user) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ user, isAuthenticated: true, accessToken: access });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, accessToken: null });
  },

  setUser: (user) => {
    set({ user });
  }
}));
