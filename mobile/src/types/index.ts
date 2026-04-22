export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  place: string | null;
  category: string | null;
  itemCount: number;
  createdAt: string;
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
  role: 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface Storage {
  id: string;
  householdId: string;
  name: string;
  emoji: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storageId?: string | null;
  storage?: Storage | null;
  category?: string | null;
  householdId: string;
  expirationDate?: string | null;
  createdBy?: User;
  createdAt: string;
  fromShoppingListName?: string | null;
}

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

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml';

export interface ShoppingActivityEvent {
  id: string;
  type: 'added' | 'sent_to_fridge';
  name: string;
  listName: string;
  createdBy?: User;
  createdAt: string;
}
