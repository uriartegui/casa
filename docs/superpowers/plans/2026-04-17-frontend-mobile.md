# Frontend Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o app mobile React Native + Expo para o projeto casa, cobrindo autenticação, gerenciamento de casas e geladeira compartilhada.

**Architecture:** Navegação híbrida (Tab Bar + Stack aninhado), AuthContext para JWT, React Query para server state, Axios com interceptors para a API REST do backend NestJS.

**Tech Stack:** Expo ~51, React Navigation 6, TanStack React Query 5, Axios 1, AsyncStorage, react-native-qrcode-svg

---

## File Map

| Arquivo | Responsabilidade |
|---------|-----------------|
| `mobile/App.tsx` | Entry point — providers + RootNavigator |
| `mobile/src/constants/colors.ts` | Tokens de cor iOS HIG |
| `mobile/src/types/index.ts` | Interfaces TypeScript: User, Household, FridgeItem |
| `mobile/src/services/api.ts` | Instância Axios + interceptors (auth header, 401) |
| `mobile/src/context/AuthContext.tsx` | Estado de auth global: user, token, login, logout |
| `mobile/src/context/SelectedHouseholdContext.tsx` | Casa selecionada atualmente (compartilhada entre abas) |
| `mobile/src/hooks/useHouseholds.ts` | React Query hooks para households |
| `mobile/src/hooks/useFridge.ts` | React Query hooks para fridge items |
| `mobile/src/navigation/RootNavigator.tsx` | Alterna AuthStack ↔ AppTabs baseado em auth |
| `mobile/src/navigation/AuthStack.tsx` | Stack: Login → Register |
| `mobile/src/navigation/AppTabs.tsx` | Tab bar 3 abas + stacks aninhados |
| `mobile/src/screens/auth/LoginScreen.tsx` | Formulário de login |
| `mobile/src/screens/auth/RegisterScreen.tsx` | Formulário de registro |
| `mobile/src/screens/households/HouseholdListScreen.tsx` | Lista de casas do usuário |
| `mobile/src/screens/households/CreateHouseholdScreen.tsx` | Criar nova casa |
| `mobile/src/screens/households/HouseholdDetailScreen.tsx` | Detalhe da casa + ações |
| `mobile/src/screens/households/InviteScreen.tsx` | Código + share + QR |
| `mobile/src/screens/households/JoinHouseholdScreen.tsx` | Entrar com código |
| `mobile/src/screens/fridge/FridgeScreen.tsx` | Lista de itens da geladeira |
| `mobile/src/screens/fridge/AddFridgeItemScreen.tsx` | Adicionar item |
| `mobile/src/screens/profile/ProfileScreen.tsx` | Perfil + logout |

---

## Task 1: Inicializar projeto Expo + git

**Files:**
- Create: `mobile/` (diretório raiz do app)

- [ ] **Step 1: Criar projeto Expo com template TypeScript**

```bash
cd C:\dev\casa
npx create-expo-app mobile --template blank-typescript
```

Expected: pasta `mobile/` criada com `App.tsx`, `package.json`, `tsconfig.json`.

- [ ] **Step 2: Inicializar git no monorepo raiz (se ainda não existir)**

```bash
cd C:\dev\casa
git init
echo "node_modules/" >> .gitignore
echo ".expo/" >> .gitignore
echo "dist/" >> .gitignore
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 3: Commit inicial**

```bash
cd C:\dev\casa
git add mobile/ .gitignore
git commit -m "chore: initialize Expo mobile project"
```

---

## Task 2: Instalar dependências

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Instalar dependências de navegação**

```bash
cd C:\dev\casa\mobile
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

- [ ] **Step 2: Instalar React Query + Axios + AsyncStorage**

```bash
npx expo install @tanstack/react-query axios @react-native-async-storage/async-storage
```

- [ ] **Step 3: Instalar QR code + SVG + Sharing**

```bash
npx expo install react-native-svg react-native-qrcode-svg expo-sharing expo-clipboard
```

- [ ] **Step 4: Instalar gesture handler (necessário para swipe-to-delete)**

```bash
npx expo install react-native-gesture-handler
```

- [ ] **Step 5: Verificar instalação**

```bash
npx expo start --no-dev 2>&1 | head -20
```

Expected: sem erros de módulo não encontrado.

- [ ] **Step 6: Commit**

```bash
cd C:\dev\casa
git add mobile/package.json mobile/package-lock.json
git commit -m "chore: install mobile dependencies"
```

---

## Task 3: Constantes de cor + tipos TypeScript

**Files:**
- Create: `mobile/src/constants/colors.ts`
- Create: `mobile/src/types/index.ts`

- [ ] **Step 1: Criar pasta src e constantes de cor**

```bash
mkdir -p C:\dev\casa\mobile\src\constants
mkdir -p C:\dev\casa\mobile\src\types
```

- [ ] **Step 2: Criar `mobile/src/constants/colors.ts`**

```typescript
export const Colors = {
  background: '#f2f2f7',
  card: '#ffffff',
  accent: '#007AFF',
  textPrimary: '#000000',
  textSecondary: '#8e8e93',
  separator: '#e5e5ea',
  destructive: '#ff3b30',
  success: '#34c759',
  border: '#c7c7cc',
} as const;
```

- [ ] **Step 3: Criar `mobile/src/types/index.ts`**

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  user?: User;
}

export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  householdId: string;
  addedBy?: User;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml';
```

- [ ] **Step 4: Commit**

```bash
cd C:\dev\casa
git add mobile/src/
git commit -m "feat: add TypeScript types and color constants"
```

---

## Task 4: Serviço de API (Axios)

**Files:**
- Create: `mobile/src/services/api.ts`

- [ ] **Step 1: Criar pasta services**

```bash
mkdir -p C:\dev\casa\mobile\src\services
```

- [ ] **Step 2: Criar `mobile/src/services/api.ts`**

```typescript
import axios from 'axios';

// Android emulator: use '10.0.2.2:3000'
// iOS simulator ou Expo Go na mesma rede: use o IP da máquina
const BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 3: Commit**

```bash
cd C:\dev\casa
git add mobile/src/services/
git commit -m "feat: add API service with axios and auth interceptor"
```

---

## Task 5: AuthContext

**Files:**
- Create: `mobile/src/context/AuthContext.tsx`

- [ ] **Step 1: Criar pasta context**

```bash
mkdir -p C:\dev\casa\mobile\src\context
```

- [ ] **Step 2: Criar `mobile/src/context/AuthContext.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, setUnauthorizedHandler } from '../services/api';
import { User, AuthResponse } from '../types';

const TOKEN_KEY = '@casa:token';
const USER_KEY = '@casa:user';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user: loggedUser } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setAuthToken(access_token);
    setToken(access_token);
    setUser(loggedUser);
  }

  async function logout() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 3: Commit**

```bash
cd C:\dev\casa
git add mobile/src/context/AuthContext.tsx
git commit -m "feat: add AuthContext with AsyncStorage persistence"
```

---

## Task 6: SelectedHouseholdContext

**Files:**
- Create: `mobile/src/context/SelectedHouseholdContext.tsx`

- [ ] **Step 1: Criar `mobile/src/context/SelectedHouseholdContext.tsx`**

```typescript
import React, { createContext, useContext, useState } from 'react';

interface SelectedHouseholdContextData {
  selectedHouseholdId: string | null;
  setSelectedHouseholdId: (id: string | null) => void;
}

const SelectedHouseholdContext = createContext<SelectedHouseholdContextData>(
  {} as SelectedHouseholdContextData
);

export function SelectedHouseholdProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  return (
    <SelectedHouseholdContext.Provider value={{ selectedHouseholdId, setSelectedHouseholdId }}>
      {children}
    </SelectedHouseholdContext.Provider>
  );
}

export function useSelectedHousehold() {
  return useContext(SelectedHouseholdContext);
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/context/SelectedHouseholdContext.tsx
git commit -m "feat: add SelectedHouseholdContext for cross-tab state"
```

---

## Task 7: React Query hooks — Households

**Files:**
- Create: `mobile/src/hooks/useHouseholds.ts`

- [ ] **Step 1: Criar pasta hooks**

```bash
mkdir -p C:\dev\casa\mobile\src\hooks
```

- [ ] **Step 2: Criar `mobile/src/hooks/useHouseholds.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Household } from '../types';

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await api.get<Household[]>('/households');
      return response.data;
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post<Household>('/households', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useInviteCode(householdId: string) {
  return useQuery({
    queryKey: ['invite', householdId],
    queryFn: async () => {
      const response = await api.get<{ inviteCode: string }>(
        `/households/${householdId}/invite`
      );
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post<Household>(`/households/join/${code}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
cd C:\dev\casa
git add mobile/src/hooks/useHouseholds.ts
git commit -m "feat: add React Query hooks for households"
```

---

## Task 8: React Query hooks — Fridge

**Files:**
- Create: `mobile/src/hooks/useFridge.ts`

- [ ] **Step 1: Criar `mobile/src/hooks/useFridge.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FridgeItem } from '../types';

export function useFridge(householdId: string | null) {
  return useQuery({
    queryKey: ['fridge', householdId],
    queryFn: async () => {
      const response = await api.get<FridgeItem[]>(
        `/households/${householdId}/fridge`
      );
      return response.data;
    },
    enabled: !!householdId,
  });
}

interface AddFridgeItemPayload {
  name: string;
  quantity: number;
  unit: string;
}

export function useAddFridgeItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddFridgeItemPayload) => {
      const response = await api.post<FridgeItem>(
        `/households/${householdId}/fridge`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
    },
  });
}

export function useRemoveFridgeItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/households/${householdId}/fridge/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/hooks/useFridge.ts
git commit -m "feat: add React Query hooks for fridge"
```

---

## Task 9: Navegação

**Files:**
- Create: `mobile/src/navigation/AuthStack.tsx`
- Create: `mobile/src/navigation/AppTabs.tsx`
- Create: `mobile/src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Criar pasta navigation**

```bash
mkdir -p C:\dev\casa\mobile\src\navigation
```

- [ ] **Step 2: Criar `mobile/src/navigation/AuthStack.tsx`**

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Criar `mobile/src/navigation/AppTabs.tsx`**

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';

import HouseholdListScreen from '../screens/households/HouseholdListScreen';
import CreateHouseholdScreen from '../screens/households/CreateHouseholdScreen';
import HouseholdDetailScreen from '../screens/households/HouseholdDetailScreen';
import InviteScreen from '../screens/households/InviteScreen';
import JoinHouseholdScreen from '../screens/households/JoinHouseholdScreen';
import FridgeScreen from '../screens/fridge/FridgeScreen';
import AddFridgeItemScreen from '../screens/fridge/AddFridgeItemScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type HouseholdStackParamList = {
  HouseholdList: undefined;
  CreateHousehold: undefined;
  HouseholdDetail: { householdId: string; householdName: string };
  Invite: { householdId: string };
  JoinHousehold: undefined;
};

export type FridgeStackParamList = {
  Fridge: undefined;
  AddFridgeItem: { householdId: string };
};

const HouseholdStack = createNativeStackNavigator<HouseholdStackParamList>();
const FridgeStack = createNativeStackNavigator<FridgeStackParamList>();
const Tab = createBottomTabNavigator();

function HouseholdNavigator() {
  return (
    <HouseholdStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.accent,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
      }}
    >
      <HouseholdStack.Screen name="HouseholdList" component={HouseholdListScreen} options={{ title: 'Minhas Casas' }} />
      <HouseholdStack.Screen name="CreateHousehold" component={CreateHouseholdScreen} options={{ title: 'Nova Casa', presentation: 'modal' }} />
      <HouseholdStack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} options={({ route }) => ({ title: route.params.householdName })} />
      <HouseholdStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Convidar' }} />
      <HouseholdStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} options={{ title: 'Entrar com Código' }} />
    </HouseholdStack.Navigator>
  );
}

function FridgeNavigator() {
  return (
    <FridgeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.accent,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
      }}
    >
      <FridgeStack.Screen name="Fridge" component={FridgeScreen} options={{ title: 'Geladeira' }} />
      <FridgeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
    </FridgeStack.Navigator>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.separator },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="CasaTab"
        component={HouseholdNavigator}
        options={{ title: 'Casa', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="GeladeirTab"
        component={FridgeNavigator}
        options={{ title: 'Geladeira', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🧊</Text> }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={ProfileScreen}
        options={{ title: 'Perfil', headerShown: true, headerStyle: { backgroundColor: Colors.card }, headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' }, tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 4: Criar `mobile/src/navigation/RootNavigator.tsx`**

```typescript
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import { Colors } from '../constants/colors';

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthStack />;
}
```

- [ ] **Step 5: Commit**

```bash
cd C:\dev\casa
git add mobile/src/navigation/
git commit -m "feat: add navigation structure (AuthStack, AppTabs, RootNavigator)"
```

---

## Task 10: App.tsx — Entry point com providers

**Files:**
- Modify: `mobile/App.tsx`

- [ ] **Step 1: Substituir conteúdo de `mobile/App.tsx`**

```typescript
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SelectedHouseholdProvider } from './src/context/SelectedHouseholdContext';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SelectedHouseholdProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </SelectedHouseholdProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/App.tsx
git commit -m "feat: wire up App.tsx with all providers and navigation"
```

---

## Task 11: Criar placeholders de tela para testar navegação

Antes de implementar cada tela, criar placeholders para garantir que a navegação funciona end-to-end.

**Files:**
- Create: todas as telas como stubs

- [ ] **Step 1: Criar estrutura de pastas para telas**

```bash
mkdir -p C:\dev\casa\mobile\src\screens\auth
mkdir -p C:\dev\casa\mobile\src\screens\households
mkdir -p C:\dev\casa\mobile\src\screens\fridge
mkdir -p C:\dev\casa\mobile\src\screens\profile
```

- [ ] **Step 2: Criar placeholders**

Criar cada arquivo abaixo com o conteúdo mínimo:

`mobile/src/screens/auth/LoginScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function LoginScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Login</Text></View>;
}
```

`mobile/src/screens/auth/RegisterScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function RegisterScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Register</Text></View>;
}
```

`mobile/src/screens/households/HouseholdListScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function HouseholdListScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Casas</Text></View>;
}
```

`mobile/src/screens/households/CreateHouseholdScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function CreateHouseholdScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Criar Casa</Text></View>;
}
```

`mobile/src/screens/households/HouseholdDetailScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function HouseholdDetailScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Detalhe</Text></View>;
}
```

`mobile/src/screens/households/InviteScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function InviteScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Convite</Text></View>;
}
```

`mobile/src/screens/households/JoinHouseholdScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function JoinHouseholdScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Entrar</Text></View>;
}
```

`mobile/src/screens/fridge/FridgeScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function FridgeScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Geladeira</Text></View>;
}
```

`mobile/src/screens/fridge/AddFridgeItemScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function AddFridgeItemScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Adicionar</Text></View>;
}
```

`mobile/src/screens/profile/ProfileScreen.tsx`:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Perfil</Text></View>;
}
```

- [ ] **Step 3: Rodar o app e verificar navegação**

```bash
cd C:\dev\casa\mobile
npx expo start
```

Abrir no iOS Simulator ou Expo Go. Verificar:
- App abre na tela Login (placeholder)
- Tab bar visível após simular auth (comentar check de token no RootNavigator temporariamente)

- [ ] **Step 4: Commit placeholders**

```bash
cd C:\dev\casa
git add mobile/src/screens/
git commit -m "feat: add screen placeholders for navigation verification"
```

---

## Task 12: LoginScreen

**Files:**
- Modify: `mobile/src/screens/auth/LoginScreen.tsx`

- [ ] **Step 1: Implementar LoginScreen**

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha email e senha.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      Alert.alert('Erro', 'Email ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>casa</Text>
        <Text style={styles.subtitle}>Organize sua casa com sua família</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Entrar</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Não tem conta? <Text style={styles.linkAccent}>Criar conta</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 42, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  form: { gap: 12, marginBottom: 24 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/auth/LoginScreen.tsx
git commit -m "feat: implement LoginScreen"
```

---

## Task 13: RegisterScreen

**Files:**
- Modify: `mobile/src/screens/auth/RegisterScreen.tsx`

- [ ] **Step 1: Implementar RegisterScreen**

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      await login(email.trim(), password);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a conta. Email já cadastrado?');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Junte-se à sua casa</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Criar conta</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tem conta? <Text style={styles.linkAccent}>Entrar</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  form: { gap: 12, marginBottom: 24 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/auth/RegisterScreen.tsx
git commit -m "feat: implement RegisterScreen"
```

---

## Task 14: HouseholdListScreen

**Files:**
- Modify: `mobile/src/screens/households/HouseholdListScreen.tsx`

- [ ] **Step 1: Implementar HouseholdListScreen**

```typescript
import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useHouseholds } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { Household } from '../../types';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Nav = NativeStackNavigationProp<HouseholdStackParamList>;

export default function HouseholdListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: households, isLoading, refetch, isRefetching } = useHouseholds();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('CreateHousehold')} style={{ marginRight: 4 }}>
          <Text style={{ color: Colors.accent, fontSize: 28, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  function renderItem({ item }: { item: Household }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('HouseholdDetail', { householdId: item.id, householdName: item.name })}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>🏠 {item.name}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={households ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Você ainda não tem casas.</Text>
            <Text style={styles.emptyText}>Crie uma ou entre com um código.</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.joinButton} onPress={() => navigation.navigate('JoinHousehold')}>
            <Text style={styles.joinText}>Entrar com código de convite</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  list: { padding: 16, gap: 8 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, marginBottom: 4 },
  joinButton: { marginTop: 16, padding: 14, alignItems: 'center' },
  joinText: { color: Colors.accent, fontSize: 15, fontWeight: '500' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/households/HouseholdListScreen.tsx
git commit -m "feat: implement HouseholdListScreen"
```

---

## Task 15: CreateHouseholdScreen

**Files:**
- Modify: `mobile/src/screens/households/CreateHouseholdScreen.tsx`

- [ ] **Step 1: Implementar CreateHouseholdScreen**

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCreateHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Nav = NativeStackNavigationProp<HouseholdStackParamList>;

export default function CreateHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const { mutateAsync: createHousehold, isPending } = useCreateHousehold();

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome da casa.');
      return;
    }
    try {
      const household = await createHousehold(name.trim());
      navigation.navigate('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a casa.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.label}>Nome da casa</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Apartamento do Gui"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Criar Casa</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 12 },
  label: { fontSize: 13, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/households/CreateHouseholdScreen.tsx
git commit -m "feat: implement CreateHouseholdScreen"
```

---

## Task 16: HouseholdDetailScreen

**Files:**
- Modify: `mobile/src/screens/households/HouseholdDetailScreen.tsx`

- [ ] **Step 1: Implementar HouseholdDetailScreen**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Nav = NativeStackNavigationProp<HouseholdStackParamList>;
type Route = RouteProp<HouseholdStackParamList, 'HouseholdDetail'>;

export default function HouseholdDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { householdId, householdName } = route.params;
  const { setSelectedHouseholdId } = useSelectedHousehold();

  function handleViewFridge() {
    setSelectedHouseholdId(householdId);
    // Navega para a aba Geladeira usando o navigator pai
    navigation.getParent()?.navigate('GeladeirTab');
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleViewFridge}>
          <Text style={styles.rowIcon}>🧊</Text>
          <Text style={styles.rowText}>Ver Geladeira</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Invite', { householdId })}>
          <Text style={styles.rowIcon}>🔗</Text>
          <Text style={styles.rowText}>Convidar pessoas</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  section: { backgroundColor: Colors.card, borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowText: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textSecondary },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 52 },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/households/HouseholdDetailScreen.tsx
git commit -m "feat: implement HouseholdDetailScreen"
```

---

## Task 17: InviteScreen

**Files:**
- Modify: `mobile/src/screens/households/InviteScreen.tsx`

- [ ] **Step 1: Implementar InviteScreen**

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useInviteCode } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Route = RouteProp<HouseholdStackParamList, 'Invite'>;

export default function InviteScreen() {
  const route = useRoute<Route>();
  const { householdId } = route.params;
  const { data, isLoading } = useInviteCode(householdId);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = data?.inviteCode ?? '';

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    try {
      await Share.share({ message: `Entre na minha casa no app Casa! Código: ${code}` });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.codeSection}>
        <Text style={styles.label}>Código de Convite</Text>
        <Text style={styles.code}>{code}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleCopy}>
          <Text style={styles.buttonText}>{copied ? '✓ Copiado!' : 'Copiar Código'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handleShare}>
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setShowQR(!showQR)}>
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>{showQR ? 'Ocultar QR' : 'Ver QR Code'}</Text>
        </TouchableOpacity>
      </View>

      {showQR && code ? (
        <View style={styles.qrContainer}>
          <QRCode value={code} size={200} color={Colors.textPrimary} backgroundColor={Colors.card} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  codeSection: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 20,
    alignItems: 'center', marginBottom: 24,
  },
  label: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  code: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 2 },
  actions: { gap: 10 },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonOutline: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonTextOutline: { color: Colors.accent },
  qrContainer: { marginTop: 32, alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 24 },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/households/InviteScreen.tsx
git commit -m "feat: implement InviteScreen with copy, share and QR code"
```

---

## Task 18: JoinHouseholdScreen

**Files:**
- Modify: `mobile/src/screens/households/JoinHouseholdScreen.tsx`

- [ ] **Step 1: Implementar JoinHouseholdScreen**

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useJoinHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Nav = NativeStackNavigationProp<HouseholdStackParamList>;

export default function JoinHouseholdScreen() {
  const navigation = useNavigation<Nav>();
  const [code, setCode] = useState('');
  const { mutateAsync: joinHousehold, isPending } = useJoinHousehold();

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('Erro', 'Cole ou digite o código de convite.');
      return;
    }
    try {
      const household = await joinHousehold(code.trim());
      navigation.navigate('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch {
      Alert.alert('Erro', 'Código inválido ou você já é membro dessa casa.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Cole o código de convite que você recebeu para entrar em uma casa.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Cole o código aqui"
          placeholderTextColor={Colors.textSecondary}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Entrar na Casa</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 12 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/households/JoinHouseholdScreen.tsx
git commit -m "feat: implement JoinHouseholdScreen"
```

---

## Task 19: FridgeScreen

**Files:**
- Modify: `mobile/src/screens/fridge/FridgeScreen.tsx`

- [ ] **Step 1: Implementar FridgeScreen**

```typescript
import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFridge, useRemoveFridgeItem } from '../../hooks/useFridge';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { Colors } from '../../constants/colors';
import { FridgeItem } from '../../types';
import { FridgeStackParamList } from '../../navigation/AppTabs';

type Nav = NativeStackNavigationProp<FridgeStackParamList>;

export default function FridgeScreen() {
  const navigation = useNavigation<Nav>();
  const { data: households } = useHouseholds();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();

  const activeId = selectedHouseholdId ?? (households?.[0]?.id ?? null);
  const { data: items, isLoading, refetch, isRefetching } = useFridge(activeId);
  const { mutate: removeItem } = useRemoveFridgeItem(activeId ?? '');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        activeId ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFridgeItem', { householdId: activeId })}
            style={{ marginRight: 4 }}
          >
            <Text style={{ color: Colors.accent, fontSize: 28, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, activeId]);

  function handleDelete(itemId: string) {
    Alert.alert('Remover item', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeItem(itemId) },
    ]);
  }

  function renderRightActions(itemId: string) {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(itemId)}>
        <Text style={styles.deleteText}>Remover</Text>
      </TouchableOpacity>
    );
  }

  if (!households?.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Você não tem casas.</Text>
        <Text style={styles.emptyText}>Crie uma casa primeiro.</Text>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      {households && households.length > 1 && (
        <View style={styles.householdSelector}>
          <FlatList
            horizontal
            data={households}
            keyExtractor={(h) => h.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, item.id === activeId && styles.chipActive]}
                onPress={() => setSelectedHouseholdId(item.id)}
              >
                <Text style={[styles.chipText, item.id === activeId && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        renderItem={({ item, index }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <View style={[
              styles.row,
              index === 0 && styles.rowFirst,
              index === (items?.length ?? 0) - 1 && styles.rowLast,
            ]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowName}>{item.name}</Text>
              </View>
              <Text style={styles.rowQty}>{item.quantity} {item.unit}</Text>
            </View>
          </Swipeable>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Geladeira vazia.</Text>
            <Text style={styles.emptyText}>Toque em + para adicionar um item.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  householdSelector: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16 },
  row: {
    backgroundColor: Colors.card, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 0, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  rowFirst: { borderRadius: 10, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  rowLast: { borderBottomWidth: 0, borderRadius: 10, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  rowContent: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowQty: { fontSize: 14, color: Colors.textSecondary },
  emptyText: { color: Colors.textSecondary, fontSize: 15, marginBottom: 4 },
  deleteAction: {
    backgroundColor: Colors.destructive, justifyContent: 'center',
    alignItems: 'flex-end', paddingHorizontal: 20,
  },
  deleteText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/fridge/FridgeScreen.tsx
git commit -m "feat: implement FridgeScreen with swipe-to-delete"
```

---

## Task 20: AddFridgeItemScreen

**Files:**
- Modify: `mobile/src/screens/fridge/AddFridgeItemScreen.tsx`

- [ ] **Step 1: Implementar AddFridgeItemScreen**

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { Colors } from '../../constants/colors';
import { Unit, FridgeStackParamList } from '../../navigation/AppTabs';
import type { Unit as UnitType } from '../../types';

type Route = RouteProp<FridgeStackParamList, 'AddFridgeItem'>;

const UNITS: UnitType[] = ['un', 'kg', 'g', 'L', 'ml'];

export default function AddFridgeItemScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { householdId } = route.params;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<UnitType>('un');
  const { mutateAsync: addItem, isPending } = useAddFridgeItem(householdId);

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    try {
      await addItem({ name: name.trim(), quantity: qty, unit });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Leite"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Unidade</Text>
              <View style={styles.unitRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Adicionar à Geladeira</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: Colors.card, borderRadius: 10, overflow: 'hidden' },
  field: { padding: 14 },
  fieldHalf: { flex: 1, padding: 14 },
  fieldLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 16, color: Colors.textPrimary },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 14 },
  row: { flexDirection: 'row' },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  unitTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/fridge/AddFridgeItemScreen.tsx
git commit -m "feat: implement AddFridgeItemScreen"
```

---

## Task 21: ProfileScreen

**Files:**
- Modify: `mobile/src/screens/profile/ProfileScreen.tsx`

- [ ] **Step 1: Implementar ProfileScreen**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 15, color: Colors.textSecondary },
  section: { backgroundColor: Colors.card, borderRadius: 10, overflow: 'hidden', marginTop: 16 },
  row: { padding: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, color: Colors.destructive, fontWeight: '500' },
});
```

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/profile/ProfileScreen.tsx
git commit -m "feat: implement ProfileScreen"
```

---

## Task 22: Fix — exportar Unit de AppTabs

O `AddFridgeItemScreen` importa `Unit` de `AppTabs` mas esse tipo vem de `types/index.ts`. Corrigir a importação.

**Files:**
- Modify: `mobile/src/screens/fridge/AddFridgeItemScreen.tsx`

- [ ] **Step 1: Corrigir import de Unit em AddFridgeItemScreen**

Remover a linha:
```typescript
import { Unit, FridgeStackParamList } from '../../navigation/AppTabs';
import type { Unit as UnitType } from '../../types';
```

Substituir por:
```typescript
import { FridgeStackParamList } from '../../navigation/AppTabs';
import type { Unit } from '../../types';
```

E substituir todas as ocorrências de `UnitType` por `Unit` no arquivo.

- [ ] **Step 2: Commit**

```bash
cd C:\dev\casa
git add mobile/src/screens/fridge/AddFridgeItemScreen.tsx
git commit -m "fix: correct Unit type import in AddFridgeItemScreen"
```

---

## Task 23: Verificação final end-to-end

- [ ] **Step 1: Garantir que o backend está rodando**

```bash
cd C:\dev\casa\backend
docker-compose up -d
npm run start:dev
```

Expected: `Application is running on: http://localhost:3000`

- [ ] **Step 2: Rodar o app**

```bash
cd C:\dev\casa\mobile
npx expo start
```

- [ ] **Step 3: Testar fluxo completo**

Verificar no iOS Simulator:
1. Tela de Login aparece
2. Registrar novo usuário → redireciona para AppTabs
3. Criar uma casa → aparece na lista
4. Acessar detalhes → clicar "Ver Geladeira" → aba Geladeira muda para essa casa
5. Adicionar item na geladeira → aparece na lista
6. Swipe to delete no item → remove com confirmação
7. Gerar código de convite → copiar e testar share
8. Logout → volta para LoginScreen

- [ ] **Step 4: Commit final**

```bash
cd C:\dev\casa
git add .
git commit -m "chore: complete mobile MVP Fase 1"
```
