# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar push notifications quando alguém adicionar um item na geladeira ou lista de compras, usando Expo Push API no backend.

**Architecture:** Backend armazena o `pushToken` do dispositivo por usuário. Quando um item é adicionado, o backend chama a Expo Push API para notificar todos os outros membros da casa. Notificações locais de vencimento já funcionam (expiration.ts) — não alterar.

**Tech Stack:** NestJS, TypeORM, `expo-server-sdk` (backend), `expo-notifications`, `expo-device` (mobile)

---

## Mapa de arquivos

**Backend (backend/src/)**
- Modify: `users/user.entity.ts` — adicionar coluna `pushToken`
- Create: `users/dto/update-push-token.dto.ts` — DTO para receber token
- Modify: `users/users.service.ts` — método `updatePushToken`
- Modify: `users/users.controller.ts` — endpoint `PATCH /users/me/push-token`
- Modify: `users/users.module.ts` — exportar UsersService
- Create: `notifications/notifications.service.ts` — chamar Expo Push API
- Create: `notifications/notifications.module.ts` — módulo NestJS
- Modify: `households/households.module.ts` — importar NotificationsModule
- Modify: `households/households.service.ts` — injetar NotificationsService e disparar notificações
- Modify: `app.module.ts` — importar NotificationsModule

**Mobile (mobile/src/)**
- Create: `utils/pushToken.ts` — obter token do dispositivo e registrar no backend
- Modify: `context/AuthContext.tsx` — chamar registerPushToken após login/register

---

## Task 1: Backend — coluna pushToken na entidade User

**Files:**
- Modify: `backend/src/users/user.entity.ts`

- [ ] **Step 1: Adicionar coluna pushToken**

Em `backend/src/users/user.entity.ts`, adicionar após a coluna `password`:

```typescript
@Column({ nullable: true, type: 'text' })
pushToken: string | null;
```

O import `Column` já existe. Nenhuma migração necessária — TypeORM com `synchronize: true` atualiza automaticamente.

- [ ] **Step 2: Commit**

```bash
git add backend/src/users/user.entity.ts
git commit -m "feat(users): add pushToken column"
```

---

## Task 2: Backend — endpoint para registrar push token

**Files:**
- Create: `backend/src/users/dto/update-push-token.dto.ts`
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/users/users.controller.ts`

- [ ] **Step 1: Criar DTO**

Criar `backend/src/users/dto/update-push-token.dto.ts`:

```typescript
import { IsString } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  pushToken: string;
}
```

- [ ] **Step 2: Adicionar método no UsersService**

Em `backend/src/users/users.service.ts`, adicionar método:

```typescript
async updatePushToken(userId: string, pushToken: string): Promise<void> {
  await this.usersRepository.update(userId, { pushToken });
}
```

O `usersRepository` já existe injetado no serviço.

- [ ] **Step 3: Adicionar endpoint no UsersController**

Em `backend/src/users/users.controller.ts`, adicionar:

```typescript
import { Controller, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

// Dentro da classe, adicionar método:
@UseGuards(JwtAuthGuard)
@Patch('me/push-token')
async updatePushToken(@Req() req: any, @Body() dto: UpdatePushTokenDto) {
  await this.usersService.updatePushToken(req.user.id, dto.pushToken);
  return { ok: true };
}
```

- [ ] **Step 4: Verificar que UsersService é exportado no módulo**

Em `backend/src/users/users.module.ts`, garantir que `exports: [UsersService]` está presente. Se não estiver, adicionar.

- [ ] **Step 5: Testar endpoint manualmente**

```bash
# Obter token primeiro via login
curl -X POST https://casa-api-4fq0.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"suasenha"}'

# Registrar token fake para testar
curl -X PATCH https://casa-api-4fq0.onrender.com/users/me/push-token \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pushToken":"ExponentPushToken[test123]"}'
# Esperado: {"ok":true}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/users/dto/update-push-token.dto.ts \
        backend/src/users/users.service.ts \
        backend/src/users/users.controller.ts \
        backend/src/users/users.module.ts
git commit -m "feat(users): endpoint PATCH /users/me/push-token"
```

---

## Task 3: Backend — NotificationsService (chama Expo Push API)

**Files:**
- Create: `backend/src/notifications/notifications.service.ts`
- Create: `backend/src/notifications/notifications.module.ts`

- [ ] **Step 1: Instalar expo-server-sdk**

```bash
cd backend && npm install expo-server-sdk
```

Esperado: pacote instalado sem erros.

- [ ] **Step 2: Criar NotificationsService**

Criar `backend/src/notifications/notifications.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  private expo = new Expo();

  constructor(
    @InjectRepository(HouseholdMember)
    private membersRepo: Repository<HouseholdMember>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async notifyHouseholdMembers(
    householdId: string,
    excludeUserId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const members = await this.membersRepo.find({ where: { householdId } });
    const otherUserIds = members
      .map((m) => m.userId)
      .filter((id) => id !== excludeUserId);

    if (otherUserIds.length === 0) return;

    const users = await this.usersRepo.find({
      where: { id: In(otherUserIds) },
    });

    const messages: ExpoPushMessage[] = users
      .filter((u) => u.pushToken && Expo.isExpoPushToken(u.pushToken))
      .map((u) => ({
        to: u.pushToken as string,
        title,
        body,
        sound: 'default' as const,
      }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk).catch(() => {});
    }
  }
}
```

- [ ] **Step 3: Criar NotificationsModule**

Criar `backend/src/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { HouseholdMember } from '../households/household-member.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdMember, User])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 4: Registrar no AppModule**

Em `backend/src/app.module.ts`, adicionar `NotificationsModule` nos imports:

```typescript
import { NotificationsModule } from './notifications/notifications.module';
// ... dentro de imports: [..., NotificationsModule]
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/notifications/ backend/src/app.module.ts backend/package.json backend/package-lock.json
git commit -m "feat(notifications): NotificationsService via Expo Push API"
```

---

## Task 4: Backend — disparar notificação ao adicionar item na geladeira

**Files:**
- Modify: `backend/src/households/households.module.ts`
- Modify: `backend/src/households/households.service.ts`

- [ ] **Step 1: Importar NotificationsModule no HouseholdsModule**

Em `backend/src/households/households.module.ts`, adicionar nos imports:

```typescript
import { NotificationsModule } from '../notifications/notifications.module';
// ... dentro de imports: [..., NotificationsModule]
```

- [ ] **Step 2: Injetar NotificationsService no HouseholdsService**

Em `backend/src/households/households.service.ts`, adicionar no construtor:

```typescript
import { NotificationsService } from '../notifications/notifications.service';

// No construtor, adicionar parâmetro:
private notificationsService: NotificationsService,
```

- [ ] **Step 3: Disparar notificação em addFridgeItem**

No método `addFridgeItem` do HouseholdsService, após o `await this.fridgeRepo.save(...)`, adicionar:

```typescript
// Buscar nome do usuário para a notificação
const member = await this.membersRepo.findOne({
  where: { userId, householdId },
  relations: ['user'],
});
const userName = member?.user?.name ?? 'Alguém';

this.notificationsService
  .notifyHouseholdMembers(
    householdId,
    userId,
    '🧊 Item adicionado na geladeira',
    `${userName} adicionou ${item.name}`,
  )
  .catch(() => {});
```

Nota: `.catch(() => {})` — notificação nunca deve bloquear a resposta principal.

- [ ] **Step 4: Commit**

```bash
git add backend/src/households/households.module.ts backend/src/households/households.service.ts
git commit -m "feat(notifications): notify members on fridge item add"
```

---

## Task 5: Backend — disparar notificação ao adicionar item na lista de compras

**Files:**
- Modify: `backend/src/households/households.service.ts`

- [ ] **Step 1: Disparar notificação em addListItem**

No método `addListItem` do HouseholdsService, após salvar o item, buscar o nome da lista e disparar:

```typescript
const list = await this.shoppingListsRepo.findOne({ where: { id: listId } });
const member = await this.membersRepo.findOne({
  where: { userId, householdId },
  relations: ['user'],
});
const userName = member?.user?.name ?? 'Alguém';
const listName = list?.name ?? 'lista';

this.notificationsService
  .notifyHouseholdMembers(
    householdId,
    userId,
    '🛒 Item adicionado na lista',
    `${userName} adicionou ${item.name} em "${listName}"`,
  )
  .catch(() => {});
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/households/households.service.ts
git commit -m "feat(notifications): notify members on shopping list item add"
```

---

## Task 6: Mobile — registrar Expo Push Token no backend

**Files:**
- Create: `mobile/src/utils/pushToken.ts`
- Modify: `mobile/src/context/AuthContext.tsx`

- [ ] **Step 1: Criar utilitário pushToken**

Criar `mobile/src/utils/pushToken.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api';

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return; // emulador não suporta push real

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'SEU_PROJECT_ID_AQUI', // pegar em app.json > expo.extra.eas.projectId
  });

  await api.patch('/users/me/push-token', { pushToken: tokenData.data }).catch(() => {});
}
```

- [ ] **Step 2: Obter projectId do app.json**

Abrir `mobile/app.json` e copiar o valor de `expo.extra.eas.projectId`. Substituir `'SEU_PROJECT_ID_AQUI'` na função acima pelo valor real.

- [ ] **Step 3: Verificar que expo-device está instalado**

```bash
cd mobile && npx expo install expo-device
```

Se já instalado, não faz nada.

- [ ] **Step 4: Chamar registerPushToken no AuthContext**

Em `mobile/src/context/AuthContext.tsx`, após o login e register bem-sucedidos, adicionar chamada:

```typescript
import { registerPushToken } from '../utils/pushToken';

// Dentro de login(), após setAuthToken e armazenar user no AsyncStorage:
registerPushToken().catch(() => {}); // fire and forget

// Dentro de register(), após mesmo ponto:
registerPushToken().catch(() => {});
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/utils/pushToken.ts mobile/src/context/AuthContext.tsx
git commit -m "feat(mobile): register Expo push token on login"
```

---

## Task 7: Deploy e teste end-to-end

- [ ] **Step 1: Deploy backend**

```bash
cd backend && git push
# ou via Render: merge para main dispara deploy automático
```

- [ ] **Step 2: Build novo APK**

```bash
cd mobile && eas build --platform android --profile preview
```

Instalar APK no dispositivo físico (emulador não recebe push real).

- [ ] **Step 3: Teste**

1. Instalar APK em dois celulares com contas diferentes na mesma casa
2. Aceitar permissão de notificação
3. No celular 1, adicionar item na geladeira
4. Celular 2 deve receber push "🧊 Item adicionado na geladeira — [nome] adicionou [item]"
5. Repetir para lista de compras

- [ ] **Step 4: Verificar tokens no banco**

```bash
# Conectar ao postgres e verificar
docker exec -it <container> psql -U casa -d casa -c "SELECT id, name, email, \"pushToken\" FROM users WHERE \"pushToken\" IS NOT NULL;"
```

---

## Observações

- **Emulador**: `Device.isDevice` retorna `false` — push token não é registrado. Para testar, usar dispositivo físico ou Expo Go com conta Expo logada.
- **Notificações locais de vencimento** (expiration.ts): já funcionam — não alterar nada.
- **Erro silenciado**: todas as chamadas de notificação usam `.catch(() => {})` para nunca bloquear a resposta da API.
- **Expo Push API**: gratuita para até 1000 notificações/mês no free tier. Sem limite real para apps pequenos.
