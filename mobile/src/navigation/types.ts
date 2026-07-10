export type HouseholdStackParamList = {
  HouseholdList: undefined;
  CreateHousehold: undefined;
  HouseholdDetail: { householdId: string; householdName: string };
  HouseholdMembers: { householdId: string; householdName: string };
  HouseholdSettings: { householdId: string; householdName: string };
  Invite: { householdId: string };
  JoinHousehold: { initialCode?: string } | undefined;
  MemberDetail: { householdId: string; memberId: string };
  ManageCategories: { householdId: string; householdName: string };
  ManageStorages: { householdId: string; householdName: string };
  HouseTasks: { householdId: string; householdName: string; initialCategory?: string; highlightTaskId?: string };
};

export type RootStackParamList = {
  HomeFlow: undefined;
  Menu: undefined;
  StorageFlow: { screen?: keyof FridgeStackParamList; params?: any } | undefined;
  ShoppingFlow: { screen?: keyof ShoppingStackParamList; params?: any } | undefined;
  TasksFlow: { screen?: 'TasksEntry' | 'TaskCategory'; params?: { category?: string; highlightTaskId?: string } } | undefined;
  HouseholdFlow: undefined;
  ProfileFlow: undefined;
};

export type FridgeStackParamList = {
  StorageOverview: undefined;
  StorageActivity: { householdId: string };
  Fridge: { householdId: string; storageId: string; storageName: string; storageEmoji: string; highlightItemId?: string };
  AddFridgeItem: { householdId: string; storageId?: string };
  FridgeItemDetail: { itemId: string; householdId: string; highlight?: boolean };
  CreateStorage: { householdId: string };
};

export type ShoppingStackParamList = {
  ShoppingLists: undefined;
  ShoppingActivity: { householdId: string };
  ShoppingListDetail: {
    householdId: string;
    listId: string;
    listName: string;
    listUrgent: boolean;
    listPlace?: string | null;
    listCategory?: string | null;
    highlightItemId?: string;
    highlightList?: boolean;
    focusAddItem?: boolean;
  };
  CreateShoppingList: { householdId: string };
  AddShoppingItem: {
    householdId: string;
    listId: string;
    prefillName?: string;
    prefillQuantity?: number;
    prefillUnit?: string;
  };
  SendToFridge: {
    householdId: string;
    listId: string;
    itemId: string;
    prefillName: string;
    prefillQuantity: number;
    prefillUnit: string | null;
    prefillCategory?: string | null;
    listName: string;
  };
};

export type HomeStackParamList = {
  Home: undefined;
  AddFridgeItem: { householdId: string };
  HomeShoppingListDetail: { householdId: string; listId: string; listName: string; listUrgent: boolean; highlightList?: boolean; focusAddItem?: boolean };
  HomeCreateShoppingList: { householdId: string };
  AddShoppingItem: {
    householdId: string;
    listId?: string;
    prefillName?: string;
    prefillQuantity?: number;
    prefillUnit?: string;
  };
};
