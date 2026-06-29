import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import HouseholdListScreen from '../screens/households/HouseholdListScreen';
import CreateHouseholdScreen from '../screens/households/CreateHouseholdScreen';
import HouseholdDetailScreen from '../screens/households/HouseholdDetailScreen';
import HouseholdMembersScreen from '../screens/households/HouseholdMembersScreen';
import HouseholdSettingsScreen from '../screens/households/HouseholdSettingsScreen';
import InviteScreen from '../screens/households/InviteScreen';
import JoinHouseholdScreen from '../screens/households/JoinHouseholdScreen';
import MemberDetailScreen from '../screens/households/MemberDetailScreen';
import ManageCategoriesScreen from '../screens/households/ManageCategoriesScreen';
import ManageStoragesScreen from '../screens/households/ManageStoragesScreen';
import HouseTasksScreen from '../screens/households/HouseTasksScreen';
import StorageActivityScreen from '../screens/fridge/StorageActivityScreen';
import FridgeScreen from '../screens/fridge/FridgeScreen';
import AddFridgeItemScreen from '../screens/fridge/AddFridgeItemScreen';
import CreateStorageScreen from '../screens/fridge/CreateStorageScreen';
import FridgeItemDetailScreen from '../screens/fridge/FridgeItemDetailScreen';
import ShoppingListsScreen from '../screens/shopping/ShoppingListsScreen';
import ShoppingActivityScreen from '../screens/shopping/ShoppingActivityScreen';
import ShoppingListDetailScreen from '../screens/shopping/ShoppingListDetailScreen';
import AddShoppingItemScreen from '../screens/shopping/AddShoppingItemScreen';
import CreateShoppingListScreen from '../screens/shopping/CreateShoppingListScreen';
import SendToFridgeScreen from '../screens/shopping/SendToFridgeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import HomeScreen from '../screens/home/HomeScreen';
import { useHouseholds } from '../hooks/useHouseholds';
import { useSelectedHousehold } from '../context/SelectedHouseholdContext';
import AppHeader, { StorageHouseholdHeader } from '../components/AppHeader';
import SideMenuScreen from '../components/SideMenu';
import {
  FridgeStackParamList,
  HomeStackParamList,
  HouseholdStackParamList,
  RootStackParamList,
  ShoppingStackParamList,
} from './types';

const HouseholdStack = createNativeStackNavigator<HouseholdStackParamList>();
const FridgeStack = createNativeStackNavigator<FridgeStackParamList>();
const ShoppingStack = createNativeStackNavigator<ShoppingStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator();
const TasksStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  header: (props: any) => <AppHeader {...props} />,
};

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <HomeStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      {/* Telas tipadas para o ShoppingStack, reutilizadas aqui com rotas compativeis */}
      <HomeStack.Screen name="HomeShoppingListDetail" component={ShoppingListDetailScreen as unknown as React.ComponentType} options={({ route }) => ({ title: route.params.listName })} />
      <HomeStack.Screen name="HomeCreateShoppingList" component={CreateShoppingListScreen as unknown as React.ComponentType} options={{ title: 'Nova Lista', presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}

function HouseholdNavigator() {
  return (
    <HouseholdStack.Navigator screenOptions={stackScreenOptions}>
      <HouseholdStack.Screen name="HouseholdList" component={HouseholdListScreen} options={{ title: 'Minhas Casas', headerBackVisible: false }} />
      <HouseholdStack.Screen name="CreateHousehold" component={CreateHouseholdScreen} options={{ title: 'Nova Casa', presentation: 'modal' }} />
      <HouseholdStack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} options={({ route }) => ({ title: route.params.householdName })} />
      <HouseholdStack.Screen name="HouseholdMembers" component={HouseholdMembersScreen} options={({ route }) => ({ title: `Pessoas - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} options={{ title: 'Configurações' }} />
      <HouseholdStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Convidar' }} />
      <HouseholdStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} options={{ title: 'Entrar com código' }} />
      <HouseholdStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Membro' }} />
      <HouseholdStack.Screen name="ManageStorages" component={ManageStoragesScreen} options={({ route }) => ({ title: `Estoques - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="ManageCategories" component={ManageCategoriesScreen} options={({ route }) => ({ title: `Categorias - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="HouseTasks" component={HouseTasksScreen} options={({ route }) => ({ title: `Checklist - ${route.params.householdName}` })} />
    </HouseholdStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </ProfileStack.Navigator>
  );
}

function TasksEntryScreen({ navigation, route, initialCategory }: any) {
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const household = households?.find((h) => h.id === effectiveId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Carregando...</Text>
      </View>
    );
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.mutedText}>Crie ou entre em uma casa primeiro.</Text>
      </View>
    );
  }

  return (
    <HouseTasksScreen
      navigation={navigation}
      route={{
        key: 'TasksEntry',
        name: 'HouseTasks',
        params: { householdId: effectiveId, householdName: household?.name ?? 'Casa', initialCategory, highlightTaskId: route?.params?.highlightTaskId },
      } as any}
    />
  );
}

function TaskCategoryScreen({ navigation, route }: any) {
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const household = households?.find((h) => h.id === effectiveId);

  if (isLoading || !effectiveId) {
    return <View style={styles.center}><Text style={styles.mutedText}>{isLoading ? 'Carregando...' : 'Nenhuma casa selecionada'}</Text></View>;
  }

  return <HouseTasksScreen key={`task-category-${route.params.category}`} navigation={navigation} route={{ key: `TaskCategory-${route.params.category}`, name: 'HouseTasks', params: { householdId: effectiveId, householdName: household?.name ?? 'Casa', initialCategory: route.params.category, highlightTaskId: route.params.highlightTaskId } } as any} />;
}

function TasksNavigator() {
  return (
    <TasksStack.Navigator screenOptions={stackScreenOptions}>
      <TasksStack.Screen name="TasksEntry" options={{ title: 'Tarefas' }}>
        {(props) => <TasksEntryScreen {...props} />}
      </TasksStack.Screen>
      <TasksStack.Screen name="TaskCategory" component={TaskCategoryScreen} options={({ route }: any) => ({ title: route.params.category, headerBackVisible: false })} />
    </TasksStack.Navigator>
  );
}

function FridgeNavigator() {
  const { data: households } = useHouseholds();

  return (
    <FridgeStack.Navigator screenOptions={stackScreenOptions}>
      <FridgeStack.Screen name="StorageActivity" component={StorageActivityScreen} options={{ title: 'Atividade dos estoques', headerBackVisible: false }} />
      <FridgeStack.Screen
        name="Fridge"
        component={FridgeScreen}
        options={({ route, navigation }) => {
          const householdName = households?.find((household) => household.id === route.params.householdId)?.name;
          return {
            headerBackVisible: false,
            headerTitle: () => <StorageHouseholdHeader navigation={navigation} storageName={route.params.storageName} householdName={householdName ?? ''} />,
          };
        }}
      />
      <FridgeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <FridgeStack.Screen name="FridgeItemDetail" component={FridgeItemDetailScreen} options={{ title: 'Detalhes', presentation: 'modal' }} />
      <FridgeStack.Screen name="CreateStorage" component={CreateStorageScreen} options={{ title: 'Novo Compartimento', presentation: 'modal' }} />
    </FridgeStack.Navigator>
  );
}

function ShoppingNavigator() {
  return (
    <ShoppingStack.Navigator screenOptions={stackScreenOptions}>
      <ShoppingStack.Screen name="ShoppingLists" component={ShoppingListsScreen} options={{ title: 'Listas de Compras', headerBackVisible: false }} />
      <ShoppingStack.Screen name="ShoppingActivity" component={ShoppingActivityScreen} options={{ title: 'Atividade da lista' }} />
      <ShoppingStack.Screen name="ShoppingListDetail" component={ShoppingListDetailScreen} options={({ route }) => ({ title: route.params.listName })} />
      <ShoppingStack.Screen name="CreateShoppingList" component={CreateShoppingListScreen} options={{ title: 'Nova Lista', presentation: 'modal' }} />
      <ShoppingStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <ShoppingStack.Screen name="SendToFridge" component={SendToFridgeScreen} options={{ title: 'Guardar no estoque', presentation: 'modal' }} />
    </ShoppingStack.Navigator>
  );
}

export default function AppStacks() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="HomeFlow">
      <RootStack.Screen name="HomeFlow" component={HomeNavigator} />
      <RootStack.Screen
        name="Menu"
        component={SideMenuScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <RootStack.Screen name="StorageFlow" component={FridgeNavigator} />
      <RootStack.Screen name="ShoppingFlow" component={ShoppingNavigator} />
      <RootStack.Screen name="TasksFlow" component={TasksNavigator} />
      <RootStack.Screen name="HouseholdFlow" component={HouseholdNavigator} />
      <RootStack.Screen name="ProfileFlow" component={ProfileNavigator} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  mutedText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
