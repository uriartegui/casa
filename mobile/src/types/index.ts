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
