# Multi Shopping Lists + Fridge Expansion

Date: 2026-04-22  
Status: Approved

## Overview

Replace the single shopping list per household with multiple named lists. Each list has a name, place (store), and category — all free text. Expand fridge items to support location (geladeira/freezer/despensa), category (dynamic from existing items), and expiry date.

## Data Model

### New entity: `shopping_lists`
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| householdId | uuid | FK households |
| name | string | free text |
| place | string | free text, nullable |
| category | string | free text, nullable |
| createdById | uuid | FK users |
| createdAt | timestamp | |

### Modified entity: `shopping_items`
- Add `shoppingListId` (uuid, FK shopping_lists) — replaces direct householdId for item queries
- Keep `householdId` for backward compatibility and direct household-level queries

### Modified entity: `fridge_items`
- Add `location` (enum: `geladeira` | `freezer` | `despensa`, default `geladeira`)
- Add `category` (string, nullable)
- Add `expiryDate` (date, nullable)

## Backend API

### Shopping Lists CRUD
- `GET /households/:id/shopping-lists` → ShoppingList[] (with itemCount)
- `POST /households/:id/shopping-lists` → ShoppingList
- `PATCH /households/:id/shopping-lists/:listId` → ShoppingList
- `DELETE /households/:id/shopping-lists/:listId` → 204

### Shopping Items (scoped to list)
- `GET /households/:id/shopping-lists/:listId/items` → ShoppingItem[]
- `POST /households/:id/shopping-lists/:listId/items` → ShoppingItem
- `PATCH /households/:id/shopping-lists/:listId/items/:itemId` → ShoppingItem (toggle checked)
- `DELETE /households/:id/shopping-lists/:listId/items/:itemId` → 204
- `DELETE /households/:id/shopping-lists/:listId/items/checked` → 204 (clear checked)

### Fridge categories
- `GET /households/:id/fridge/categories` → string[] (DISTINCT categories in use)

### Fridge items (existing routes, new fields)
- `POST /households/:id/fridge` — now accepts `location`, `category`, `expiryDate`
- `GET /households/:id/fridge` — now returns `location`, `category`, `expiryDate`

## Mobile UX

### ShoppingListScreen (rewritten)
- Shows list of cards per shopping list
- Each card: name, category badge (if set), place, item count
- Tap card → opens bottom modal with list items
- Long press card → options: Editar, Excluir
- FAB "+ Nova Lista" at bottom

### CreateShoppingListScreen (new)
- Fields: Nome*, Categoria (texto livre), Lugar (texto livre)

### Shopping List Modal (new component)
- Header: list name + place
- Section "A COMPRAR": unchecked items
- Section "COMPRADOS": checked items, each with inline "Geladeira" and "X" buttons
- Bottom: "+ Adicionar Item" button
- Tap "X" on checked item → removes immediately
- Tap "Geladeira" on checked item → opens SendToFridgeModal

### SendToFridgeModal (new component, 2-step)
**Step 1 — Location picker:**
- 3 cards: Geladeira, Freezer, Despensa
- Tap → goes to step 2

**Step 2 — Details form:**
- Nome (prefilled, editable)
- Quantidade + Unidade (prefilled, editable)
- Categoria: chips from `GET /fridge/categories` + "+ Nova" for free text input
- Validade: date input, optional
- "Confirmar" button → POST to fridge, removes item from shopping list

### FridgeScreen (updated)
- Each fridge item now shows: location badge (geladeira/freezer/despensa), category (if set), expiry date (if set, red if expired or near expiry ≤3 days)

### AddFridgeItemScreen (updated)
- Add location picker (default: geladeira)
- Add category field (chips from existing + "+ Nova")
- Add expiry date field (optional)

## WebSocket Events
Emit on all mutations (shopping list and item CRUD) to keep members in sync:
- `shopping-list:created`, `shopping-list:updated`, `shopping-list:deleted`
- `shopping-item:created`, `shopping-item:updated`, `shopping-item:deleted`
- `fridge-item:created` (existing, already emitted)

## Migration Strategy
- New DB migration: create `shopping_lists`, alter `shopping_items` (add shoppingListId), alter `fridge_items` (add location, category, expiryDate)
- Existing `shopping_items` with no `shoppingListId` are orphaned — migration creates one default list per household named "Lista Geral" and assigns all existing items to it
