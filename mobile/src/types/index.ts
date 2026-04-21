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
  householdId: string;
  addedBy?: User;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  householdId: string;
  createdBy?: User;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml';
