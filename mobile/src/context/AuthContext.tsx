import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, setUnauthorizedHandler } from '../services/api';
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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  async function login(email: string, password: string) {
    queryClient.clear();
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { accessToken, user: loggedUser } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setAuthToken(accessToken);
    setToken(accessToken);
    setUser(loggedUser);
    registerPushToken().then((result) => {
      if (!result.ok) console.warn('[Auth] Push token não registrado:', result.reason, result.detail ?? '');
    });
  }

  async function register(name: string, email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
    const { accessToken, user: registeredUser } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(registeredUser));
    setAuthToken(accessToken);
    setToken(accessToken);
    setUser(registeredUser);
    registerPushToken().then((result) => {
      if (!result.ok) console.warn('[Auth] Push token não registrado:', result.reason, result.detail ?? '');
    });
  }

  async function markOnboardingSeen() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }

  async function logout() {
    socket.disconnect();
    queryClient.clear();
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, hasSeenOnboarding, markOnboardingSeen, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
