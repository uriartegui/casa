# Multi Shopping Lists + Fridge Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single shopping list per household with multiple named lists (name, place, category), each with full item CRUD, and a 2-step "send to fridge" flow that uses existing storages and fridge categories.

**Architecture:** New `ShoppingList` entity (FK to household) + `shoppingListId` added to `ShoppingItem`. TypeORM `synchronize: true` auto-applies schema changes. Mobile rewrites ShoppingListScreen into a card list; item CRUD moves into a modal component per list. Fridge expansion is minimal — `category` and `expirationDate` already exist; new endpoint exposes distinct categories as chips.

**Tech Stack:** NestJS + TypeORM + PostgreSQL (backend), React Native + Expo + React Query + TypeScript (mobile)

---

## File Map

### Backend — new files
- `backend/src/households/shopping-list.entity.ts` — ShoppingList entity
- `backend/src/households/dto/create-shopping-list.dto.ts` — DTO for create/update list
- `backend/src/households/dto/add-list-item.dto.ts` — DTO for adding item to list

### Backend — modified files
- `backend/src/households/shopping-item.entity.ts` — add `shoppingListId` nullable FK
- `backend/src/households/households.module.ts` — register ShoppingList entity
- `backend/src/households/households.service.ts` — add shopping list service methods + fridge categories
- `backend/src/households/households.controller.ts` — add new routes

### Mobile — new files
- `mobile/src/hooks/useShoppingLists.ts` — React Query hooks for shopping lists + items
- `mobile/src/screens/shopping/CreateShoppingListScreen.tsx` — create/edit list form
- `mobile/src/components/ShoppingListModal.tsx` — modal showing items for a list
- `mobile/src/components/SendToFridgeModal.tsx` — 2-step fridge send modal

### Mobile — modified files
- `mobile/src/types/index.ts` — add ShoppingList type, update ShoppingItem
- `mobile/src/navigation/AppTabs.tsx` — add CreateShoppingList to ShoppingStack
- `mobile/src/screens/shopping/ShoppingListScreen.tsx` — full rewrite to card list
- `mobile/src/hooks/useFridge.ts` — add useFridgeCategories hook

---

### Task 1: ShoppingList entity

**Files:**
- Create: `backend/src/households/shopping-list.entity.ts`

- [ ] **Step 1: Create the entity**

```typescript
// backend/src/households/shopping-list.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';
import { User } from '../users/user.entity';

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  householdId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  place: string | null;

  @Column({ nullable: true })
  category: string | null;

  @Column()
  createdById: string;

  @ManyToOne(() => Household)
  @JoinColumn({ name: 'householdId' })
  household: Household;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Add shoppingListId to ShoppingItem entity**

Edit `backend/src/households/shopping-item.entity.ts` — add after the `householdId` column:

```typescript
@Column({ type: 'uuid', nullable: true })
shoppingListId: string | null;

@ManyToOne(() => ShoppingList, { nullable: true })
@JoinColumn({ name: 'shoppingListId' })
shoppingList: ShoppingList | null;
```

Also add the import at top:
```typescript
import { ShoppingList } from './shopping-list.entity';
```

- [ ] **Step 3: Register ShoppingList in households.module.ts**

```typescript
// backend/src/households/households.module.ts
import { ShoppingList } from './shopping-list.entity';

// In TypeOrmModule.forFeature([...]) array, add ShoppingList:
TypeOrmModule.forFeature([Household, HouseholdMember, FridgeItem, ShoppingItem, Storage, HouseholdInvite, ShoppingList])
```

- [ ] **Step 4: Inject ShoppingList repo in service constructor**

In `households.service.ts`, add import and inject:
```typescript
import { ShoppingList } from './shopping-list.entity';

// In constructor parameters, add:
@InjectRepository(ShoppingList)
private shoppingListsRepo: Repository<ShoppingList>,
```

- [ ] **Step 5: Restart backend and verify table created**

```bash
cd backend && npm run start:dev
```

Expected: No TypeORM errors. Check DB: `docker exec -it casa-postgres psql -U casa -d casa -c "\dt"` — should see `shopping_lists` table and `shopping_list_id` column in `shopping_items`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/households/shopping-list.entity.ts backend/src/households/shopping-item.entity.ts backend/src/households/households.module.ts backend/src/households/households.service.ts
git commit -m "feat(backend): add ShoppingList entity and shoppingListId FK on ShoppingItem"
```

---

### Task 2: Shopping List DTOs

**Files:**
- Create: `backend/src/households/dto/create-shopping-list.dto.ts`
- Create: `backend/src/households/dto/add-list-item.dto.ts`

- [ ] **Step 1: Create shopping list DTO**

```typescript
// backend/src/households/dto/create-shopping-list.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShoppingListDto {
  @ApiProperty({ example: 'Mercado Semanal' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Carrefour' })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional({ example: 'Hortifruti' })
  @IsOptional()
  @IsString()
  category?: string;
}
```

- [ ] **Step 2: Create add-list-item DTO**

```typescript
// backend/src/households/dto/add-list-item.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddListItemDto {
  @ApiProperty({ example: 'Alface' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsOptional()
  @IsString()
  unit?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/households/dto/create-shopping-list.dto.ts backend/src/households/dto/add-list-item.dto.ts
git commit -m "feat(backend): add shopping list DTOs"
```

---

### Task 3: Shopping List Service Methods

**Files:**
- Modify: `backend/src/households/households.service.ts`

- [ ] **Step 1: Add getShoppingLists**

Add after the existing shopping list methods:

```typescript
async getShoppingLists(householdId: string, userId: string): Promise<(ShoppingList & { itemCount: number })[]> {
  await this.requireMembership(householdId, userId);
  const lists = await this.shoppingListsRepo.find({
    where: { householdId },
    order: { createdAt: 'ASC' },
  });
  const counts = await Promise.all(
    lists.map((l) => this.shoppingRepo.count({ where: { shoppingListId: l.id } })),
  );
  return lists.map((l, i) => Object.assign(l, { itemCount: counts[i] }));
}
```

- [ ] **Step 2: Add createShoppingList**

```typescript
async createShoppingList(
  householdId: string,
  userId: string,
  dto: CreateShoppingListDto,
): Promise<ShoppingList> {
  await this.requireMembership(householdId, userId);
  const list = this.shoppingListsRepo.create({
    householdId,
    createdById: userId,
    name: dto.name,
    place: dto.place ?? null,
    category: dto.category ?? null,
  });
  return this.shoppingListsRepo.save(list);
}
```

- [ ] **Step 3: Add updateShoppingList**

```typescript
async updateShoppingList(
  householdId: string,
  listId: string,
  userId: string,
  dto: CreateShoppingListDto,
): Promise<ShoppingList> {
  await this.requireMembership(householdId, userId);
  const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
  if (!list) throw new NotFoundException('Lista não encontrada');
  Object.assign(list, {
    name: dto.name,
    place: dto.place ?? null,
    category: dto.category ?? null,
  });
  return this.shoppingListsRepo.save(list);
}
```

- [ ] **Step 4: Add deleteShoppingList**

```typescript
async deleteShoppingList(householdId: string, listId: string, userId: string): Promise<void> {
  await this.requireMembership(householdId, userId);
  const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
  if (!list) throw new NotFoundException('Lista não encontrada');
  await this.shoppingRepo.delete({ shoppingListId: listId });
  await this.shoppingListsRepo.delete(listId);
}
```

- [ ] **Step 5: Add getListItems**

```typescript
async getListItems(householdId: string, listId: string, userId: string): Promise<ShoppingItem[]> {
  await this.requireMembership(householdId, userId);
  return this.shoppingRepo.find({
    where: { shoppingListId: listId, householdId },
    order: { createdAt: 'ASC' },
  });
}
```

- [ ] **Step 6: Add addListItem**

```typescript
async addListItem(
  householdId: string,
  listId: string,
  userId: string,
  dto: AddListItemDto,
): Promise<ShoppingItem> {
  await this.requireMembership(householdId, userId);
  const list = await this.shoppingListsRepo.findOne({ where: { id: listId, householdId } });
  if (!list) throw new NotFoundException('Lista não encontrada');
  const item = this.shoppingRepo.create({
    householdId,
    shoppingListId: listId,
    createdById: userId,
    name: dto.name,
    quantity: dto.quantity ?? 1,
    unit: dto.unit ?? null,
    checked: false,
  });
  const saved = await this.shoppingRepo.save(item);
  this.eventsGateway.emitHouseholdUpdate(householdId);
  return saved;
}
```

- [ ] **Step 7: Add toggleListItem**

```typescript
async toggleListItem(
  householdId: string,
  listId: string,
  itemId: string,
  userId: string,
  checked: boolean,
): Promise<ShoppingItem> {
  await this.requireMembership(householdId, userId);
  const item = await this.shoppingRepo.findOne({ where: { id: itemId, shoppingListId: listId, householdId } });
  if (!item) throw new NotFoundException('Item não encontrado');
  item.checked = checked;
  const saved = await this.shoppingRepo.save(item);
  this.eventsGateway.emitHouseholdUpdate(householdId);
  return saved;
}
```

- [ ] **Step 8: Add removeListItem**

```typescript
async removeListItem(
  householdId: string,
  listId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  await this.requireMembership(householdId, userId);
  await this.shoppingRepo.delete({ id: itemId, shoppingListId: listId, householdId });
  this.eventsGateway.emitHouseholdUpdate(householdId);
}
```

- [ ] **Step 9: Add clearCheckedListItems**

```typescript
async clearCheckedListItems(householdId: string, listId: string, userId: string): Promise<void> {
  await this.requireMembership(householdId, userId);
  await this.shoppingRepo.delete({ shoppingListId: listId, householdId, checked: true });
  this.eventsGateway.emitHouseholdUpdate(householdId);
}
```

- [ ] **Step 10: Add getFridgeCategories**

```typescript
async getFridgeCategories(householdId: string, userId: string): Promise<string[]> {
  await this.requireMembership(householdId, userId);
  const result = await this.fridgeRepo
    .createQueryBuilder('item')
    .select('DISTINCT item.category', 'category')
    .where('item.householdId = :householdId', { householdId })
    .andWhere('item.category IS NOT NULL')
    .getRawMany<{ category: string }>();
  return result.map((r) => r.category);
}
```

- [ ] **Step 11: Add imports at top of service**

```typescript
import { ShoppingList } from './shopping-list.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
```

- [ ] **Step 12: Add membership check helper**

There is no `requireMembership` helper — all new methods must use this inline pattern (same as existing service methods):

```typescript
const member = await this.membersRepo.findOne({ where: { householdId, userId } });
if (!member) throw new ForbiddenException('Você não é membro desta casa');
```

Add this check at the start of every new service method (`getShoppingLists`, `createShoppingList`, `updateShoppingList`, `deleteShoppingList`, `getListItems`, `addListItem`, `toggleListItem`, `removeListItem`, `clearCheckedListItems`, `getFridgeCategories`).

- [ ] **Step 13: Commit**

```bash
git add backend/src/households/households.service.ts
git commit -m "feat(backend): add shopping list and fridge categories service methods"
```

---

### Task 4: Shopping List Controller Routes

**Files:**
- Modify: `backend/src/households/households.controller.ts`

- [ ] **Step 1: Add imports at top of controller**

```typescript
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
```

- [ ] **Step 2: Add shopping lists CRUD routes**

Add before the existing `// Shopping list` section:

```typescript
// Shopping Lists

@Get(':id/shopping-lists')
@ApiOperation({ summary: 'Listar listas de compras' })
getShoppingLists(@Param('id') id: string, @Request() req) {
  return this.householdsService.getShoppingLists(id, req.user.id);
}

@Post(':id/shopping-lists')
@ApiOperation({ summary: 'Criar lista de compras' })
createShoppingList(
  @Param('id') id: string,
  @Body() dto: CreateShoppingListDto,
  @Request() req,
) {
  return this.householdsService.createShoppingList(id, req.user.id, dto);
}

@Patch(':id/shopping-lists/:listId')
@ApiOperation({ summary: 'Editar lista de compras' })
updateShoppingList(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Body() dto: CreateShoppingListDto,
  @Request() req,
) {
  return this.householdsService.updateShoppingList(id, listId, req.user.id, dto);
}

@Delete(':id/shopping-lists/:listId')
@ApiOperation({ summary: 'Excluir lista de compras' })
deleteShoppingList(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Request() req,
) {
  return this.householdsService.deleteShoppingList(id, listId, req.user.id);
}

// Shopping List Items

@Get(':id/shopping-lists/:listId/items')
@ApiOperation({ summary: 'Listar itens da lista' })
getListItems(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Request() req,
) {
  return this.householdsService.getListItems(id, listId, req.user.id);
}

@Post(':id/shopping-lists/:listId/items')
@ApiOperation({ summary: 'Adicionar item à lista' })
addListItem(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Body() dto: AddListItemDto,
  @Request() req,
) {
  return this.householdsService.addListItem(id, listId, req.user.id, dto);
}

@Patch(':id/shopping-lists/:listId/items/:itemId')
@ApiOperation({ summary: 'Marcar/desmarcar item' })
toggleListItem(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Param('itemId') itemId: string,
  @Body() dto: ToggleShoppingItemDto,
  @Request() req,
) {
  return this.householdsService.toggleListItem(id, listId, itemId, req.user.id, dto.checked);
}

@Delete(':id/shopping-lists/:listId/items/checked')
@ApiOperation({ summary: 'Limpar itens comprados da lista' })
clearCheckedListItems(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Request() req,
) {
  return this.householdsService.clearCheckedListItems(id, listId, req.user.id);
}

@Delete(':id/shopping-lists/:listId/items/:itemId')
@ApiOperation({ summary: 'Remover item da lista' })
removeListItem(
  @Param('id') id: string,
  @Param('listId') listId: string,
  @Param('itemId') itemId: string,
  @Request() req,
) {
  return this.householdsService.removeListItem(id, listId, itemId, req.user.id);
}
```

- [ ] **Step 3: Add fridge categories route**

Add in the `// Fridge` section, before `@Get(':id/fridge')`:

```typescript
@Get(':id/fridge/categories')
@ApiOperation({ summary: 'Categorias de itens da geladeira' })
getFridgeCategories(@Param('id') id: string, @Request() req) {
  return this.householdsService.getFridgeCategories(id, req.user.id);
}
```

**IMPORTANT:** This route must be declared BEFORE `@Get(':id/fridge')` or NestJS will match `categories` as the storageId query param instead. Place it first in the Fridge section.

- [ ] **Step 4: Restart backend and test routes**

```bash
cd backend && npm run start:dev
```

Test with curl:
```bash
# Replace TOKEN and HOUSEHOLD_ID with real values
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/households/HOUSEHOLD_ID/shopping-lists
# Expected: []

curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Mercado","place":"Carrefour","category":"Hortifruti"}' \
  http://localhost:3000/households/HOUSEHOLD_ID/shopping-lists
# Expected: { id, name, place, category, householdId, createdById, createdAt }
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/households/households.controller.ts
git commit -m "feat(backend): add shopping list CRUD and fridge categories routes"
```

---

### Task 5: Mobile Types + Hooks

**Files:**
- Modify: `mobile/src/types/index.ts`
- Create: `mobile/src/hooks/useShoppingLists.ts`
- Modify: `mobile/src/hooks/useFridge.ts`

- [ ] **Step 1: Add ShoppingList type and update ShoppingItem**

In `mobile/src/types/index.ts`, add after the `Household` interface:

```typescript
export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  place: string | null;
  category: string | null;
  itemCount: number;
  createdAt: string;
}
```

Update `ShoppingItem` — add `shoppingListId`:

```typescript
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  householdId: string;
  shoppingListId: string | null;
  createdBy?: User;
  createdAt: string;
}
```

- [ ] **Step 2: Create useShoppingLists.ts**

```typescript
// mobile/src/hooks/useShoppingLists.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShoppingList, ShoppingItem } from '../types';

export function useShoppingLists(householdId: string | null) {
  return useQuery({
    queryKey: ['shopping-lists', householdId],
    queryFn: async () => {
      const res = await api.get<ShoppingList[]>(`/households/${householdId}/shopping-lists`);
      return res.data;
    },
    enabled: !!householdId,
  });
}

export function useCreateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; place?: string; category?: string }) => {
      const res = await api.post<ShoppingList>(`/households/${householdId}/shopping-lists`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useUpdateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, ...data }: { listId: string; name: string; place?: string; category?: string }) => {
      const res = await api.patch<ShoppingList>(`/households/${householdId}/shopping-lists/${listId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useDeleteShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useListItems(householdId: string | null, listId: string | null) {
  return useQuery({
    queryKey: ['shopping-list-items', householdId, listId],
    queryFn: async () => {
      const res = await api.get<ShoppingItem[]>(
        `/households/${householdId}/shopping-lists/${listId}/items`,
      );
      return res.data;
    },
    enabled: !!householdId && !!listId,
  });
}

export function useAddListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number; unit?: string }) => {
      const res = await api.post<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useToggleListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const res = await api.patch<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
        { checked },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
    },
  });
}

export function useRemoveListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useClearCheckedListItems(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/checked`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
    },
  });
}
```

- [ ] **Step 3: Add useFridgeCategories to useFridge.ts**

Add at the end of `mobile/src/hooks/useFridge.ts`:

```typescript
export function useFridgeCategories(householdId: string | null) {
  return useQuery({
    queryKey: ['fridge-categories', householdId],
    queryFn: async () => {
      const res = await api.get<string[]>(`/households/${householdId}/fridge/categories`);
      return res.data;
    },
    enabled: !!householdId,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/types/index.ts mobile/src/hooks/useShoppingLists.ts mobile/src/hooks/useFridge.ts
git commit -m "feat(mobile): add ShoppingList types and hooks"
```

---

### Task 6: Navigation Update

**Files:**
- Modify: `mobile/src/navigation/AppTabs.tsx`

- [ ] **Step 1: Add CreateShoppingList to ShoppingStackParamList**

```typescript
export type ShoppingStackParamList = {
  ShoppingList: undefined;
  CreateShoppingList: { listId?: string; initialName?: string; initialPlace?: string; initialCategory?: string };
};
```

Remove `AddShoppingItem` from `ShoppingStackParamList` — item addition now happens inside the modal, not via navigation.

- [ ] **Step 2: Update ShoppingNavigator**

```typescript
import CreateShoppingListScreen from '../screens/shopping/CreateShoppingListScreen';

function ShoppingNavigator() {
  return (
    <ShoppingStack.Navigator screenOptions={stackScreenOptions}>
      <ShoppingStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Listas de Compras' }} />
      <ShoppingStack.Screen
        name="CreateShoppingList"
        component={CreateShoppingListScreen}
        options={({ route }) => ({
          title: route.params?.listId ? 'Editar Lista' : 'Nova Lista',
          presentation: 'modal',
        })}
      />
    </ShoppingStack.Navigator>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/navigation/AppTabs.tsx
git commit -m "feat(mobile): update shopping navigation for multi-list"
```

---

### Task 7: CreateShoppingListScreen

**Files:**
- Create: `mobile/src/screens/shopping/CreateShoppingListScreen.tsx`

- [ ] **Step 1: Create the screen**

```typescript
// mobile/src/screens/shopping/CreateShoppingListScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useCreateShoppingList, useUpdateShoppingList } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'CreateShoppingList'>;
  route: RouteProp<ShoppingStackParamList, 'CreateShoppingList'>;
};

export default function CreateShoppingListScreen({ navigation, route }: Props) {
  const { listId, initialName, initialPlace, initialCategory } = route.params ?? {};
  const { selectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const householdId = selectedHouseholdId ?? households?.[0]?.id ?? '';

  const [name, setName] = useState(initialName ?? '');
  const [place, setPlace] = useState(initialPlace ?? '');
  const [category, setCategory] = useState(initialCategory ?? '');

  const create = useCreateShoppingList(householdId);
  const update = useUpdateShoppingList(householdId);
  const isEditing = !!listId;
  const isPending = create.isPending || update.isPending;

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Digite um nome para a lista.');
      return;
    }
    const payload = {
      name: name.trim(),
      place: place.trim() || undefined,
      category: category.trim() || undefined,
    };
    if (isEditing) {
      update.mutate({ listId, ...payload }, { onSuccess: () => navigation.goBack() });
    } else {
      create.mutate(payload, { onSuccess: () => navigation.goBack() });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Mercado Semanal"
          placeholderTextColor={Colors.textSecondary}
          autoFocus
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Lugar</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder="Ex: Carrefour"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Categoria</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Ex: Hortifruti, Limpeza..."
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isPending}>
        {isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{isEditing ? 'Salvar' : 'Criar Lista'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7', padding: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 16, color: '#1c1c1e' },
  button: { backgroundColor: Colors.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/shopping/CreateShoppingListScreen.tsx
git commit -m "feat(mobile): add CreateShoppingListScreen"
```

---

### Task 8: ShoppingListModal Component

**Files:**
- Create: `mobile/src/components/ShoppingListModal.tsx`

- [ ] **Step 1: Create the modal component**

```typescript
// mobile/src/components/ShoppingListModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { ShoppingList, ShoppingItem } from '../types';
import {
  useListItems, useAddListItem, useToggleListItem,
  useRemoveListItem, useClearCheckedListItems,
} from '../hooks/useShoppingLists';
import { Colors } from '../constants/colors';

interface Props {
  list: ShoppingList;
  householdId: string;
  visible: boolean;
  onClose: () => void;
  onSendToFridge: (item: ShoppingItem) => void;
}

export default function ShoppingListModal({ list, householdId, visible, onClose, onSendToFridge }: Props) {
  const { data: items = [], isLoading } = useListItems(householdId, list.id);
  const addItem = useAddListItem(householdId, list.id);
  const toggleItem = useToggleListItem(householdId, list.id);
  const removeItem = useRemoveListItem(householdId, list.id);
  const clearChecked = useClearCheckedListItems(householdId, list.id);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const pending = items.filter((i) => !i.checked);
  const bought = items.filter((i) => i.checked);

  function handleAdd() {
    if (!newItemName.trim()) return;
    addItem.mutate(
      {
        name: newItemName.trim(),
        quantity: newItemQty ? parseFloat(newItemQty) : undefined,
        unit: newItemUnit.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewItemName('');
          setNewItemQty('');
          setNewItemUnit('');
          setShowAddForm(false);
        },
      },
    );
  }

  function handleToggle(item: ShoppingItem) {
    toggleItem.mutate({ itemId: item.id, checked: !item.checked });
  }

  function handleRemove(item: ShoppingItem) {
    removeItem.mutate(item.id);
  }

  function handleSendToFridge(item: ShoppingItem) {
    onSendToFridge(item);
  }

  function handleClearChecked() {
    if (bought.length === 0) return;
    Alert.alert('Limpar comprados', `Remover ${bought.length} item(ns) comprado(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearChecked.mutate() },
    ]);
  }

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
      <View style={styles.itemRow}>
        <TouchableOpacity onPress={() => handleToggle(item)} style={styles.checkCircle}>
          {item.checked ? (
            <View style={styles.checkFilled}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          ) : (
            <View style={styles.checkEmpty} />
          )}
        </TouchableOpacity>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.checked && styles.itemChecked]}>{item.name}</Text>
          {(item.quantity || item.unit) ? (
            <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
          ) : null}
        </View>
        {item.checked && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.fridgeBtn}
              onPress={() => handleSendToFridge(item)}
            >
              <Text style={styles.fridgeBtnText}>Geladeira</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const sections = [
    ...(pending.length > 0 ? [{ title: 'A COMPRAR', data: pending }] : []),
    ...(bought.length > 0 ? [{ title: `COMPRADOS (${bought.length})`, data: bought }] : []),
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{list.name}</Text>
              {list.place ? <Text style={styles.headerSub}>{list.place}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={[]}
              renderItem={null}
              ListHeaderComponent={
                <>
                  {sections.map((section) => (
                    <View key={section.title}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.title.startsWith('COMPRADOS') && (
                          <TouchableOpacity onPress={handleClearChecked}>
                            <Text style={styles.clearBtn}>Limpar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {section.data.map((item) => (
                        <View key={item.id} style={styles.itemWrapper}>
                          {renderItem({ item })}
                        </View>
                      ))}
                    </View>
                  ))}
                  {items.length === 0 && (
                    <Text style={styles.emptyText}>Nenhum item. Adicione abaixo.</Text>
                  )}
                </>
              }
              contentContainerStyle={styles.list}
            />
          )}

          <View style={styles.footer}>
            {showAddForm ? (
              <View style={styles.addForm}>
                <TextInput
                  style={[styles.addInput, { flex: 2 }]}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholder="Nome do item"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                />
                <TextInput
                  style={[styles.addInput, { flex: 1 }]}
                  value={newItemQty}
                  onChangeText={setNewItemQty}
                  placeholder="Qtd"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.addInput, { flex: 1 }]}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                  placeholder="Un"
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd} disabled={addItem.isPending}>
                  {addItem.isPending ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.addConfirmText}>+</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelAddBtn}>
                  <Text style={styles.cancelAddText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowAddForm(true)}>
                <Text style={styles.addItemBtnText}>+ Adicionar Item</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e5ea',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c1e' },
  headerSub: { fontSize: 13, color: '#8e8e93', marginTop: 2 },
  closeBtn: { fontSize: 16, color: Colors.accent, fontWeight: '500' },
  list: { padding: 0 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.5 },
  clearBtn: { fontSize: 13, color: Colors.accent },
  itemWrapper: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f2f2f7' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  checkCircle: { marginRight: 12 },
  checkEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#c7c7cc' },
  checkFilled: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: 'white', fontSize: 13 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, color: '#1c1c1e' },
  itemChecked: { color: '#8e8e93', textDecorationLine: 'line-through' },
  itemQty: { fontSize: 13, color: '#8e8e93', marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 6 },
  fridgeBtn: { backgroundColor: Colors.accent, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  fridgeBtnText: { color: 'white', fontSize: 12, fontWeight: '500' },
  removeBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  removeBtnText: { color: 'white', fontSize: 12, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 40, fontSize: 15 },
  footer: { backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e5ea' },
  addItemBtn: { backgroundColor: Colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  addItemBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  addForm: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: {
    backgroundColor: '#f2f2f7', borderRadius: 8, padding: 10,
    fontSize: 14, color: '#1c1c1e',
  },
  addConfirmBtn: { backgroundColor: Colors.accent, width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addConfirmText: { color: 'white', fontSize: 20, fontWeight: '600' },
  cancelAddBtn: { padding: 8 },
  cancelAddText: { color: '#8e8e93', fontSize: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/ShoppingListModal.tsx
git commit -m "feat(mobile): add ShoppingListModal component"
```

---

### Task 9: SendToFridgeModal Component

**Files:**
- Create: `mobile/src/components/SendToFridgeModal.tsx`

- [ ] **Step 1: Create the 2-step modal**

```typescript
// mobile/src/components/SendToFridgeModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ShoppingItem, Storage } from '../types';
import { useStorages } from '../hooks/useStorages';
import { useAddFridgeItem } from '../hooks/useFridge';
import { useFridgeCategories } from '../hooks/useFridge';
import { useRemoveListItem } from '../hooks/useShoppingLists';
import { Colors } from '../constants/colors';

interface Props {
  item: ShoppingItem | null;
  householdId: string;
  listId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendToFridgeModal({ item, householdId, listId, visible, onClose, onSuccess }: Props) {
  const { data: storages = [] } = useStorages(householdId);
  const { data: existingCategories = [] } = useFridgeCategories(householdId);
  const addToFridge = useAddFridgeItem(householdId);
  const removeItem = useRemoveListItem(householdId, listId);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  React.useEffect(() => {
    if (item && visible) {
      setName(item.name);
      setQuantity(String(item.quantity ?? 1));
      setUnit(item.unit ?? '');
      setCategory('');
      setCustomCategory('');
      setShowCustomCategory(false);
      setExpirationDate('');
      setStep(1);
      setSelectedStorage(null);
    }
  }, [item, visible]);

  function handleSelectStorage(storage: Storage) {
    setSelectedStorage(storage);
    setStep(2);
  }

  function handleSelectCategory(cat: string) {
    setCategory(cat);
    setShowCustomCategory(false);
    setCustomCategory('');
  }

  function handleConfirm() {
    const finalCategory = showCustomCategory ? customCategory.trim() : category;
    addToFridge.mutate(
      {
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || undefined,
        storageId: selectedStorage?.id,
        category: finalCategory || undefined,
        expirationDate: expirationDate.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (item) {
            removeItem.mutate(item.id, { onSuccess: onSuccess });
          } else {
            onSuccess();
          }
        },
      },
    );
  }

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 1 ? `Onde guardar ${item.name}?` : `${item.name} · ${selectedStorage?.name}`}
            </Text>
            <TouchableOpacity onPress={step === 1 ? onClose : () => setStep(1)}>
              <Text style={styles.closeBtn}>{step === 1 ? 'Cancelar' : 'Voltar'}</Text>
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            <View style={styles.storageList}>
              {storages.map((storage) => (
                <TouchableOpacity
                  key={storage.id}
                  style={styles.storageCard}
                  onPress={() => handleSelectStorage(storage)}
                >
                  <Text style={styles.storageEmoji}>{storage.emoji}</Text>
                  <Text style={styles.storageName}>{storage.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.field}>
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholderTextColor={Colors.textSecondary} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Unidade</Text>
                  <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="un, kg, L..." placeholderTextColor={Colors.textSecondary} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chips}>
                  {existingCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, category === cat && !showCustomCategory && styles.chipSelected]}
                      onPress={() => handleSelectCategory(cat)}
                    >
                      <Text style={[styles.chipText, category === cat && !showCustomCategory && styles.chipTextSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.chip, styles.chipNew, showCustomCategory && styles.chipSelected]}
                    onPress={() => { setShowCustomCategory(true); setCategory(''); }}
                  >
                    <Text style={[styles.chipText, showCustomCategory && styles.chipTextSelected]}>+ Nova</Text>
                  </TouchableOpacity>
                </View>
                {showCustomCategory && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholder="Digite a categoria"
                    placeholderTextColor={Colors.textSecondary}
                    autoFocus
                  />
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Validade <Text style={styles.optional}>(opcional)</Text></Text>
                <TextInput
                  style={styles.input}
                  value={expirationDate}
                  onChangeText={setExpirationDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                disabled={addToFridge.isPending || removeItem.isPending}
              >
                {addToFridge.isPending || removeItem.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmBtnText}>Adicionar à Geladeira</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e5ea',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1c1c1e', flex: 1, marginRight: 12 },
  closeBtn: { fontSize: 16, color: Colors.accent, fontWeight: '500' },
  storageList: { padding: 16, gap: 12 },
  storageCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  storageEmoji: { fontSize: 28 },
  storageName: { fontSize: 17, fontWeight: '600', color: '#1c1c1e' },
  formContent: { padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  optional: { fontWeight: '400', fontSize: 12 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 12, fontSize: 16, color: '#1c1c1e' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e5e5ea' },
  chipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipNew: { borderStyle: 'dashed' },
  chipText: { fontSize: 14, color: '#1c1c1e' },
  chipTextSelected: { color: 'white' },
  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/SendToFridgeModal.tsx
git commit -m "feat(mobile): add SendToFridgeModal 2-step component"
```

---

### Task 10: ShoppingListScreen Rewrite

**Files:**
- Modify: `mobile/src/screens/shopping/ShoppingListScreen.tsx`

- [ ] **Step 1: Rewrite ShoppingListScreen**

Replace the entire file content:

```typescript
// mobile/src/screens/shopping/ShoppingListScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { useShoppingLists, useDeleteShoppingList } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingList, ShoppingItem } from '../../types';
import ShoppingListModal from '../../components/ShoppingListModal';
import SendToFridgeModal from '../../components/SendToFridgeModal';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingList'>;
};

export default function ShoppingListScreen({ navigation }: Props) {
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const householdId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  const { data: lists = [], isLoading, refetch } = useShoppingLists(householdId);
  useRefreshOnFocus(refetch);
  const deleteList = useDeleteShoppingList(householdId ?? '');

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [openList, setOpenList] = useState<ShoppingList | null>(null);
  const [fridgeItem, setFridgeItem] = useState<ShoppingItem | null>(null);

  React.useEffect(() => {
    if (!selectedHouseholdId && households?.[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  function handleLongPress(list: ShoppingList) {
    Alert.alert(list.name, 'O que deseja fazer?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Editar',
        onPress: () =>
          navigation.navigate('CreateShoppingList', {
            listId: list.id,
            initialName: list.name,
            initialPlace: list.place ?? undefined,
            initialCategory: list.category ?? undefined,
          }),
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Excluir lista', `Excluir "${list.name}" e todos os seus itens?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => deleteList.mutate(list.id) },
          ]),
      },
    ]);
  }

  function renderList({ item }: { item: ShoppingList }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setOpenList(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{item.name}</Text>
          <View style={styles.cardMeta}>
            {item.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            ) : null}
            {item.place ? <Text style={styles.placeText}>{item.place}</Text> : null}
          </View>
        </View>
        <Text style={styles.itemCount}>{item.itemCount} {item.itemCount === 1 ? 'item' : 'itens'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderList}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma lista ainda.</Text>
              <Text style={styles.emptySubText}>Toque em + para criar uma.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateShoppingList', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {openList && householdId && (
        <ShoppingListModal
          list={openList}
          householdId={householdId}
          visible={!!openList}
          onClose={() => setOpenList(null)}
          onSendToFridge={(item) => setFridgeItem(item)}
        />
      )}

      {fridgeItem && householdId && openList && (
        <SendToFridgeModal
          item={fridgeItem}
          householdId={householdId}
          listId={openList.id}
          visible={!!fridgeItem}
          onClose={() => setFridgeItem(null)}
          onSuccess={() => setFridgeItem(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardContent: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#1c1c1e' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  categoryBadge: { backgroundColor: '#e5f0ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 12, color: Colors.accent },
  placeText: { fontSize: 12, color: '#8e8e93' },
  itemCount: { fontSize: 13, color: '#8e8e93', marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#3a3a3c' },
  emptySubText: { fontSize: 14, color: '#8e8e93', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: Colors.accent, width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/shopping/ShoppingListScreen.tsx
git commit -m "feat(mobile): rewrite ShoppingListScreen as multi-list card view"
```

---

### Task 11: WebSocket sync for shopping lists

**Files:**
- Modify: `mobile/src/hooks/useHouseholdSync.ts`

- [ ] **Step 1: Add shopping list invalidation to household:updated handler**

The backend emits a single `household:updated` event for all mutations. In `useHouseholdSync.ts`, find the `socket.on('household:updated', ...)` handler and add invalidation for the new query keys:

```typescript
socket.on('household:updated', () => {
  // existing invalidations stay — add these two:
  queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
  queryClient.invalidateQueries({ queryKey: ['shopping-list-items'] });
});
```

Do NOT replace existing invalidations — only append the two new lines inside the existing handler.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/hooks/useHouseholdSync.ts
git commit -m "feat(mobile): add shopping list WebSocket event listeners"
```

---

### Task 12: Final Integration Check

- [ ] **Step 1: Start backend**

```bash
cd backend && npm run start:dev
```

Expected: No TypeORM errors, server starts on port 3000.

- [ ] **Step 2: Start mobile**

```bash
cd mobile && npx expo start
```

Expected: No TypeScript compile errors.

- [ ] **Step 3: Test the full flow**

1. Open app → Lista tab
2. Tap + → CreateShoppingListScreen opens → fill name/place/category → save → card appears
3. Tap card → ShoppingListModal opens → add items → items appear in "A COMPRAR"
4. Tap item circle → item moves to "COMPRADOS" with Geladeira + ✕ buttons
5. Tap Geladeira → SendToFridgeModal opens → pick storage → category chips from fridge → fill expiry → confirm → item removed from list, added to fridge
6. Long press list card → Editar/Excluir options appear

- [ ] **Step 4: Known gap — AddShoppingItemScreen from HomeStack**

`HomeStack` still has `AddShoppingItem` which creates items with `householdId` but no `shoppingListId`. These items are invisible in the new UI. This screen is used from the fridge swipe flow ("adicionar à lista"). Fixing this is out of scope for this plan — the fridge swipe flow needs to be updated to pick a shopping list first. Leave it as-is for now and track as a follow-up.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: multi shopping lists with send-to-fridge flow"
```
