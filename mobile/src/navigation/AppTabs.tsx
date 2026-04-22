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
import MemberDetailScreen from '../screens/households/MemberDetailScreen';
import FridgeScreen from '../screens/fridge/FridgeScreen';
import AddFridgeItemScreen from '../screens/fridge/AddFridgeItemScreen';
import CreateStorageScreen from '../screens/fridge/CreateStorageScreen';
import FridgeItemDetailScreen from '../screens/fridge/FridgeItemDetailScreen';
import ShoppingListsScreen from '../screens/shopping/ShoppingListsScreen';
import ShoppingListDetailScreen from '../screens/shopping/ShoppingListDetailScreen';
import AddShoppingItemScreen from '../screens/shopping/AddShoppingItemScreen';
import CreateShoppingListScreen from '../screens/shopping/CreateShoppingListScreen';
import SendToFridgeScreen from '../screens/shopping/SendToFridgeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import HomeScreen from '../screens/home/HomeScreen';

export type HouseholdStackParamList = {
  HouseholdList: undefined;
  CreateHousehold: undefined;
  HouseholdDetail: { householdId: string; householdName: string };
  Invite: { householdId: string };
  JoinHousehold: undefined;
  MemberDetail: { householdId: string; memberId: string };
};

export type FridgeStackParamList = {
  Fridge: undefined;
  AddFridgeItem: { householdId: string; storageId?: string };
  FridgeItemDetail: { item: import('../types').FridgeItem; householdId: string };
  CreateStorage: { householdId: string };
};

export type ShoppingStackParamList = {
  ShoppingLists: undefined;
  ShoppingListDetail: { householdId: string; listId: string; listName: string; listUrgent: boolean };
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
    listName: string;
  };
};

export type HomeStackParamList = {
  Home: undefined;
  AddFridgeItem: { householdId: string };
  HomeShoppingListDetail: { householdId: string; listId: string; listName: string; listUrgent: boolean };
  HomeCreateShoppingList: { householdId: string };
  AddShoppingItem: {
    householdId: string;
    listId?: string;
    prefillName?: string;
    prefillQuantity?: number;
    prefillUnit?: string;
  };
};

const HouseholdStack = createNativeStackNavigator<HouseholdStackParamList>();
const FridgeStack = createNativeStackNavigator<FridgeStackParamList>();
const ShoppingStack = createNativeStackNavigator<ShoppingStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.card },
  headerTintColor: Colors.accent,
  headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' as const },
  headerButtonStyle: { backgroundColor: 'transparent' },
};

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <HomeStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <HomeStack.Screen name="HomeShoppingListDetail" component={ShoppingListDetailScreen} options={({ route }) => ({ title: route.params.listName })} />
      <HomeStack.Screen name="HomeCreateShoppingList" component={CreateShoppingListScreen} options={{ title: 'Nova Lista', presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}

function HouseholdNavigator() {
  return (
    <HouseholdStack.Navigator screenOptions={stackScreenOptions}>
      <HouseholdStack.Screen name="HouseholdList" component={HouseholdListScreen} options={{ title: 'Minhas Casas' }} />
      <HouseholdStack.Screen name="CreateHousehold" component={CreateHouseholdScreen} options={{ title: 'Nova Casa', presentation: 'modal' }} />
      <HouseholdStack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} options={({ route }) => ({ title: route.params.householdName })} />
      <HouseholdStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Convidar' }} />
      <HouseholdStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} options={{ title: 'Entrar com Código' }} />
      <HouseholdStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Membro' }} />
    </HouseholdStack.Navigator>
  );
}

function FridgeNavigator() {
  return (
    <FridgeStack.Navigator screenOptions={stackScreenOptions}>
      <FridgeStack.Screen name="Fridge" component={FridgeScreen} options={{ title: '' }} />
      <FridgeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <FridgeStack.Screen name="FridgeItemDetail" component={FridgeItemDetailScreen} options={{ title: 'Detalhes', presentation: 'modal' }} />
      <FridgeStack.Screen name="CreateStorage" component={CreateStorageScreen} options={{ title: 'Novo Compartimento', presentation: 'modal' }} />
    </FridgeStack.Navigator>
  );
}

function ShoppingNavigator() {
  return (
    <ShoppingStack.Navigator screenOptions={stackScreenOptions}>
      <ShoppingStack.Screen name="ShoppingLists" component={ShoppingListsScreen} options={{ title: 'Listas de Compras' }} />
      <ShoppingStack.Screen name="ShoppingListDetail" component={ShoppingListDetailScreen} options={({ route }) => ({ title: route.params.listName })} />
      <ShoppingStack.Screen name="CreateShoppingList" component={CreateShoppingListScreen} options={{ title: 'Nova Lista', presentation: 'modal' }} />
      <ShoppingStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <ShoppingStack.Screen name="SendToFridge" component={SendToFridgeScreen} options={{ title: 'Adicionar à Geladeira', presentation: 'modal' }} />
    </ShoppingStack.Navigator>
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
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏡</Text>,
        }}
      />
      <Tab.Screen
        name="GeladeirTab"
        component={FridgeNavigator}
        options={{ title: 'Geladeira', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🧊</Text> }}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('GeladeirTab', { screen: 'Fridge' } as never),
        })}
      />
      <Tab.Screen
        name="ListaTab"
        component={ShoppingNavigator}
        options={{ title: 'Lista', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛒</Text> }}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('ListaTab', { screen: 'ShoppingLists' } as never),
        })}
      />
      <Tab.Screen
        name="CasaTab"
        component={HouseholdNavigator}
        options={{ title: 'Casa', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('CasaTab', { screen: 'HouseholdList' } as never),
        })}
      />
      <Tab.Screen
        name="PerfilTab"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.card },
          headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
