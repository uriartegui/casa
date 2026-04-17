# Frontend Mobile — Design Spec
**Data:** 2026-04-17  
**Projeto:** casa  
**Status:** aprovado

---

## 1. Visão Geral

App mobile de organização doméstica compartilhada. MVP Fase 1 cobre tudo que o backend já suporta: autenticação, gerenciamento de casas (households), convites e geladeira compartilhada.

**Stack:** React Native + Expo  
**Pasta:** `C:\dev\casa\mobile\`

---

## 2. Identidade Visual

- **Estilo:** iOS Human Interface Guidelines (HIG)
- **Fundo:** `#f2f2f7` (iOS system background)
- **Cards/células:** `#ffffff`
- **Accent:** `#007AFF` (iOS blue)
- **Texto primário:** `#000000`
- **Texto secundário:** `#8e8e93`
- **Separadores:** `#e5e5ea`
- **Border radius cards:** `10px`
- **Tipografia:** System font (SF Pro via React Native default)

---

## 3. Navegação

Estrutura híbrida: **Tab Bar** com 3 abas + **Stack** aninhado dentro de cada aba.

```
AuthStack (sem tab bar)
  ├── LoginScreen
  └── RegisterScreen

AppTabs (tab bar visível)
  ├── Aba: Casa (ícone 🏠)
  │   ├── HouseholdListScreen       ← tela inicial da aba
  │   ├── CreateHouseholdScreen     ← modal ou stack
  │   ├── HouseholdDetailScreen
  │   ├── InviteScreen              ← código + share sheet + QR
  │   └── JoinHouseholdScreen       ← digitar código
  │
  ├── Aba: Geladeira (ícone 🧊)
  │   ├── FridgeScreen              ← lista itens da casa selecionada
  │   └── AddFridgeItemScreen       ← modal
  │
  └── Aba: Perfil (ícone 👤)
      └── ProfileScreen             ← nome, email, logout
```

**Libs de navegação:**
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`

---

## 4. Arquitetura de Estado

### Auth (React Context)
- `AuthContext` expõe `{ user, token, login, logout }`
- Token persistido em `AsyncStorage` com chave `@casa:token`
- Na inicialização do app: lê token do storage → valida → define estado
- Erro 401 em qualquer request → `logout()` automático

### Dados do Servidor (React Query)
- `QueryClient` configurado com `staleTime: 5 * 60 * 1000` (5 min)
- Um hook por recurso:

| Hook | Endpoint | Invalida |
|------|----------|----------|
| `useHouseholds()` | `GET /households` | — |
| `useCreateHousehold()` | `POST /households` | `useHouseholds` |
| `useInviteCode(id)` | `GET /households/:id/invite` | — |
| `useJoinHousehold()` | `POST /households/join/:code` | `useHouseholds` |
| `useFridge(householdId)` | `GET /households/:id/fridge` | — |
| `useAddFridgeItem(id)` | `POST /households/:id/fridge` | `useFridge` |
| `useRemoveFridgeItem(id)` | `DELETE /households/:id/fridge/:itemId` | `useFridge` |

### Serviço de API (`src/services/api.ts`)
- Instância Axios com `baseURL` apontando para backend local (`http://localhost:3000`)
- Interceptor de request: injeta `Authorization: Bearer <token>` em toda chamada
- Interceptor de response: erro 401 → chama `logout()` do AuthContext

---

## 5. Estrutura de Pastas

```
mobile/
  src/
    screens/
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
      households/
        HouseholdListScreen.tsx
        CreateHouseholdScreen.tsx
        HouseholdDetailScreen.tsx
        InviteScreen.tsx
        JoinHouseholdScreen.tsx
      fridge/
        FridgeScreen.tsx
        AddFridgeItemScreen.tsx
      profile/
        ProfileScreen.tsx
    components/
      ui/           ← botões, inputs, cards genéricos
      fridge/       ← FridgeItem, FridgeList
      households/   ← HouseholdCard
    navigation/
      AuthStack.tsx
      AppTabs.tsx
      RootNavigator.tsx   ← alterna entre AuthStack e AppTabs
    services/
      api.ts        ← instância Axios + interceptors
    hooks/
      useHouseholds.ts
      useFridge.ts
      useAuth.ts
    context/
      AuthContext.tsx
    types/
      index.ts      ← User, Household, FridgeItem, etc.
  App.tsx
```

---

## 6. Telas — Descrição Funcional

### LoginScreen
- Campos: email, senha
- Botão "Entrar" → `POST /auth/login` → salva token → navega para AppTabs
- Link "Criar conta" → RegisterScreen

### RegisterScreen
- Campos: nome, email, senha
- Botão "Cadastrar" → `POST /auth/register` → login automático

### HouseholdListScreen
- Lista cards de casas do usuário
- Botão `+` no header → CreateHouseholdScreen
- Botão "Entrar com código" → JoinHouseholdScreen
- Toque no card → HouseholdDetailScreen

### HouseholdDetailScreen
- Nome da casa, número de membros
- Botão "Ver Geladeira" → navega para aba Geladeira com `householdId` passado via React Navigation params ou salvo em `SelectedHouseholdContext`
- Botão "Convidar" → InviteScreen

### InviteScreen
- Exibe código de convite (base64)
- Botão "Copiar código"
- Botão "Compartilhar" → `Share.share()` nativo do Expo
- Botão "QR Code" → exibe QR gerado a partir do código (`expo-barcode-scanner` ou `react-native-qrcode-svg`)

### JoinHouseholdScreen
- Campo de texto para colar/digitar código
- Botão "Entrar" → `POST /households/join/:code`

### FridgeScreen
- Selector de casa no topo (se usuário tem múltiplas casas)
- Lista de itens com nome, quantidade e unidade
- Swipe to delete → `DELETE /households/:id/fridge/:itemId`
- Botão `+` → AddFridgeItemScreen (modal)

### AddFridgeItemScreen
- Campos: nome, quantidade (número), unidade (picker: un, kg, g, L, ml)
- Botão "Adicionar" → `POST /households/:id/fridge`

### ProfileScreen
- Exibe nome e email do usuário logado
- Botão "Sair" → logout → AuthStack

---

## 7. Dependências Principais

```json
{
  "expo": "~51.x",
  "@react-navigation/native": "^6",
  "@react-navigation/bottom-tabs": "^6",
  "@react-navigation/native-stack": "^6",
  "@tanstack/react-query": "^5",
  "axios": "^1",
  "@react-native-async-storage/async-storage": "^1",
  "react-native-qrcode-svg": "^6",
  "expo-sharing": "~11.x",
  "react-native-safe-area-context": "^4",
  "react-native-screens": "^3"
}
```

---

## 8. Fora de Escopo (Fase 1)

- Lista de compras (backend não implementado)
- Gerenciar membros da casa (remover, ver lista)
- Push notifications
- Modo offline
- Dark mode
- Testes automatizados

---

## 9. Backend — URL de Desenvolvimento

`http://localhost:3000` (NestJS rodando localmente)  
Porta do PostgreSQL Docker: `5433`
