import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as secureStorage from '../services/secureStorage';
import { api, setAuthToken, setUnauthorizedHandler, REFRESH_TOKEN_KEY } from '../services/api';
import socket from '../services/socket';
import { queryClient } from '../services/queryClient';
import { User, AuthResponse } from '../types';
import { registerPushToken } from '../utils/pushToken';

const TOKEN_KEY = '@colmeia:token';
const USER_KEY = '@colmeia:user';
export const ONBOARDING_KEY = '@colmeia:onboarding_seen';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    async function loadStoredAuth() {
      const [[, storedToken], [, storedUser], [, onboardingSeen]] =
        await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY, ONBOARDING_KEY]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);
      }
      setHasSeenOnboarding(onboardingSeen === 'true');
      setIsLoading(false);
    }
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  async function persistSession(data: AuthResponse) {
    const { accessToken, refreshToken, user: u } = data;
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setAuthToken(accessToken);
    setToken(accessToken);
    setUser(u);
  }

  async function login(phone: string, password: string) {
    queryClient.clear();
    const response = await api.post<AuthResponse>('/auth/login', { phone, password });
    await persistSession(response.data);
    registerPushToken().then((result) => {
      if (!result.ok) console.warn('[Auth] Push token não registrado:', result.reason, result.detail ?? '');
    });
  }

  async function register(name: string, password: string, phone: string) {
    const response = await api.post<AuthResponse>('/auth/register', { name, password, phone });
    await persistSession(response.data);
    registerPushToken().then((result) => {
      if (!result.ok) console.warn('[Auth] Push token não registrado:', result.reason, result.detail ?? '');
    });
  }

  async function logout() {
    try {
      const storedRefresh = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (storedRefresh) {
        await api.post('/auth/logout', { refreshToken: storedRefresh });
      }
    } catch {
      // ignora falha de rede no logout — limpa local de qualquer forma
    }
    socket.disconnect();
    queryClient.clear();
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  async function markOnboardingSeen() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }

  function updateUser(updated: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, hasSeenOnboarding, markOnboardingSeen, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
