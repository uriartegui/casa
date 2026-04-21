import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, setUnauthorizedHandler } from '../services/api';
import { queryClient } from '../services/queryClient';
import { User, AuthResponse } from '../types';

const TOKEN_KEY = '@casa:token';
const USER_KEY = '@casa:user';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);
      }
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
  }

  async function register(name: string, email: string, password: string) {
    queryClient.clear();
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
    const { accessToken, user: loggedUser } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setAuthToken(accessToken);
    setToken(accessToken);
    setUser(loggedUser);
  }

  async function logout() {
    queryClient.clear();
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
