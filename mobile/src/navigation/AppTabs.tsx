import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Animated, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

import HouseholdListScreen from '../screens/households/HouseholdListScreen';
import CreateHouseholdScreen from '../screens/households/CreateHouseholdScreen';
import HouseholdDetailScreen from '../screens/households/HouseholdDetailScreen';
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
import { useStorages } from '../hooks/useStorages';
import { useTaskCategories } from '../hooks/useHouseTasks';
import { api } from '../services/api';

export type HouseholdStackParamList = {
  HouseholdList: undefined;
  CreateHousehold: undefined;
  HouseholdDetail: { householdId: string; householdName: string };
  Invite: { householdId: string };
  JoinHousehold: { initialCode?: string } | undefined;
  MemberDetail: { householdId: string; memberId: string };
  ManageCategories: { householdId: string; householdName: string };
  ManageStorages: { householdId: string; householdName: string };
  HouseTasks: { householdId: string; householdName: string; initialCategory?: string };
};

export type RootStackParamList = {
  HomeFlow: undefined;
  Menu: undefined;
  StorageFlow: { screen?: keyof FridgeStackParamList; params?: any } | undefined;
  ShoppingFlow: undefined;
  TasksFlow: { screen?: 'TasksEntry' | 'TaskCategory'; params?: { category: string } } | undefined;
  HouseholdFlow: undefined;
  ProfileFlow: undefined;
};

export type FridgeStackParamList = {
  StorageOverview: undefined;
  StorageActivity: { householdId: string };
  Fridge: { householdId: string; storageId: string; storageName: string; storageEmoji: string };
  AddFridgeItem: { householdId: string; storageId?: string };
  FridgeItemDetail: { itemId: string; householdId: string };
  CreateStorage: { householdId: string };
};

export type ShoppingStackParamList = {
  ShoppingLists: undefined;
  ShoppingActivity: { householdId: string };
  ShoppingListDetail: { householdId: string; listId: string; listName: string; listUrgent: boolean; listPlace?: string | null; listCategory?: string | null };
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
const ProfileStack = createNativeStackNavigator();
const TasksStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MenuButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => {
        const parent = navigation.getParent?.();
        if (parent) parent.navigate('Menu');
        else navigation.navigate('Menu');
      }}
      style={styles.menuButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.menuButtonText}>☰</Text>
    </TouchableOpacity>
  );
}

function HeaderMenuButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => {
        const parent = navigation.getParent?.();
        if (parent) parent.navigate('Menu');
        else navigation.navigate('Menu');
      }}
      style={styles.headerMenuButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="menu" size={30} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

function StorageHouseholdHeader({ navigation, storageName, householdName }: { navigation: any; storageName: string; householdName: string }) {
  const { data: households } = useHouseholds();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const [open, setOpen] = React.useState(false);
  const activeName = households?.find((household) => household.id === selectedHouseholdId)?.name ?? householdName;

  async function changeHousehold(householdId: string) {
    setOpen(false);
    setSelectedHouseholdId(householdId);
    const response = await api.get<{ id: string; name: string; emoji: string }[]>(`/households/${householdId}/storages`);
    const storage = response.data.find((item) => item.name === storageName) ?? response.data[0];
    if (storage) navigation.replace('Fridge', { householdId, storageId: storage.id, storageName: storage.name, storageEmoji: storage.emoji });
  }

  return <View style={{ position: 'relative', minWidth: 150 }}>
    <TouchableOpacity onPress={() => setOpen((value) => !value)} activeOpacity={0.75} style={{ paddingVertical: 2 }}>
      <Text style={styles.storageHeaderTitle}>{storageName}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text style={styles.storageHeaderSubtitle}>{activeName}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={13} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
    {open && <View style={{ position: 'absolute', top: 40, left: -6, minWidth: 180, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator, borderRadius: 8, zIndex: 20, elevation: 8, overflow: 'hidden' }}>
      {(households ?? []).map((household) => <TouchableOpacity key={household.id} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: household.id === selectedHouseholdId ? Colors.accent + '12' : Colors.card }} onPress={() => changeHousehold(household.id)}><Text style={{ fontSize: 13, fontWeight: household.id === selectedHouseholdId ? '800' : '500', color: household.id === selectedHouseholdId ? Colors.accent : Colors.textPrimary }}>{household.name}</Text></TouchableOpacity>)}
    </View>}
  </View>;
}

function AppHeader({ navigation, route, options, back }: any) {
  const insets = useSafeAreaInsets();
  const title = options.title ?? route.name;
  const headerTitle = options.headerTitle;
  const headerRight = options.headerRight;
  const showBack = !!back && options.headerBackVisible !== false;

  const titleContent = typeof headerTitle === 'function'
    ? headerTitle({ children: title, tintColor: Colors.textPrimary })
    : (
      <Text style={styles.appHeaderTitle} numberOfLines={1}>
        {typeof headerTitle === 'string' ? headerTitle : title}
      </Text>
    );

  return (
    <View style={[styles.appHeader, { paddingTop: insets.top + 6 }]}>
      <View style={styles.appHeaderRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.appHeaderBack}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={26} color={Colors.accent} />
          </TouchableOpacity>
        )}
        <View style={[styles.appHeaderTitleWrap, !showBack && styles.appHeaderTitleWrapNoBack]}>
          {titleContent}
        </View>
        <View style={styles.appHeaderRight}>
          {headerRight ? headerRight({ tintColor: Colors.textPrimary }) : <HeaderMenuButton />}
        </View>
      </View>
    </View>
  );
}

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
      <HouseholdStack.Screen name="HouseholdList" component={HouseholdListScreen} options={{ title: 'Minhas Casas' }} />
      <HouseholdStack.Screen name="CreateHousehold" component={CreateHouseholdScreen} options={{ title: 'Nova Casa', presentation: 'modal' }} />
      <HouseholdStack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} options={({ route }) => ({ title: route.params.householdName })} />
      <HouseholdStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Convidar' }} />
      <HouseholdStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} options={{ title: 'Entrar com Codigo' }} />
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

function TasksEntryScreen({ navigation, initialCategory }: any) {
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
        params: { householdId: effectiveId, householdName: household?.name ?? 'Casa', initialCategory },
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

  return <HouseTasksScreen key={`task-category-${route.params.category}`} navigation={navigation} route={{ key: `TaskCategory-${route.params.category}`, name: 'HouseTasks', params: { householdId: effectiveId, householdName: household?.name ?? 'Casa', initialCategory: route.params.category } } as any} />;
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

function MenuScreen({ navigation }: any) {
  const entries = [
    { label: 'Home', detail: 'Resumo e atalhos da casa', icon: 'Home', route: 'HomeFlow' },
    { label: 'Estoque', detail: 'Geladeira, despensa, banheiro e limpeza', icon: 'Box', route: 'StorageFlow' },
    { label: 'Lista', detail: 'Listas de compras compartilhadas', icon: 'List', route: 'ShoppingFlow' },
    { label: 'Tarefas', detail: 'Checklist de limpeza e rotinas', icon: '✓', route: 'TasksFlow' },
    { label: 'Casa', detail: 'Membros, convites, categorias e estoques', icon: 'Casa', route: 'HouseholdFlow' },
    { label: 'Perfil', detail: 'Conta, seguranca e sessao', icon: 'Perfil', route: 'ProfileFlow' },
  ];

  return (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Menu</Text>
      <Text style={styles.menuSubtitle}>Escolha para onde quer ir.</Text>
      <View style={styles.menuList}>
        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.route}
            style={styles.menuCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(entry.route)}
          >
            <View style={styles.menuIconWrap}>
              <Text style={styles.menuIcon}>{entry.icon}</Text>
            </View>
            <View style={styles.menuCardText}>
              <Text style={styles.menuCardTitle}>{entry.label}</Text>
              <Text style={styles.menuCardDetail}>{entry.detail}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PolishedMenuScreen({ navigation }: any) {
  const dailyEntries = [
    { label: 'Estoque', detail: 'Itens da casa', icon: 'Box', route: 'StorageFlow' },
    { label: 'Lista', detail: 'Compras', icon: 'Lista', route: 'ShoppingFlow' },
    { label: 'Tarefas', detail: 'Rotinas', icon: '\u2713', route: 'TasksFlow' },
  ];
  const configEntries = [
    { label: 'Casa', detail: 'Membros, convites e categorias', icon: 'Casa', route: 'HouseholdFlow' },
    { label: 'Perfil', detail: 'Conta e seguranca', icon: 'Perfil', route: 'ProfileFlow' },
  ];

  return (
    <ScrollView
      style={styles.polishedMenu}
      contentContainerStyle={styles.polishedMenuContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.polishedMenuTop}>
        <View>
          <Text style={styles.polishedEyebrow}>Colmeia</Text>
          <Text style={styles.polishedTitle}>Menu</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.homeHero}
        activeOpacity={0.78}
        onPress={() => navigation.navigate('HomeFlow')}
      >
        <View>
          <Text style={styles.homeHeroTitle}>Home</Text>
          <Text style={styles.homeHeroText}>Resumo, alertas e atalhos principais.</Text>
        </View>
        <Text style={styles.homeHeroIcon}>Home</Text>
      </TouchableOpacity>

      <Text style={styles.polishedSection}>Dia a dia</Text>
      <View style={styles.dailyGrid}>
        {dailyEntries.map((entry) => (
          <TouchableOpacity
            key={entry.route}
            style={styles.dailyCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(entry.route)}
          >
            <Text style={styles.dailyIcon}>{entry.icon}</Text>
            <Text style={styles.dailyTitle}>{entry.label}</Text>
            <Text style={styles.dailyDetail}>{entry.detail}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.polishedSection}>Configuracoes</Text>
      <View style={styles.menuList}>
        {configEntries.map((entry) => (
          <TouchableOpacity
            key={entry.route}
            style={styles.menuCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(entry.route)}
          >
            <View style={styles.menuIconWrap}>
              <Text style={styles.menuIcon}>{entry.icon}</Text>
            </View>
            <View style={styles.menuCardText}>
              <Text style={styles.menuCardTitle}>{entry.label}</Text>
              <Text style={styles.menuCardDetail}>{entry.detail}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function SideMenuScreen({ navigation }: any) {
  const state = navigation.getState();
  const previousRoute = state.routes[Math.max(0, state.index - 1)]?.name ?? 'HomeFlow';
  const previousParams = state.routes[Math.max(0, state.index - 1)]?.params as { screen?: string; params?: { storageId?: string } } | undefined;
  const activeStorageId = previousRoute === 'StorageFlow' ? previousParams?.params?.storageId : undefined;
  const initialStockOpen = previousRoute === 'StorageFlow';
  const menuProgress = React.useRef(new Animated.Value(0)).current;
  const stockProgress = React.useRef(new Animated.Value(initialStockOpen ? 1 : 0)).current;
  const tasksProgress = React.useRef(new Animated.Value(previousRoute === 'TasksFlow' ? 1 : 0)).current;
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const { data: storages } = useStorages(effectiveId);
  const { data: taskCategories } = useTaskCategories(effectiveId);
  const [stockOpen, setStockOpen] = React.useState(initialStockOpen);
  const [tasksOpen, setTasksOpen] = React.useState(previousRoute === 'TasksFlow');
  const defaultTaskCategoryNames = ['Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutencao', 'Compras', 'Organizacao', 'Outros'];
  const taskCategoryNames = taskCategories?.length
    ? taskCategories.map((category) => category.name)
    : defaultTaskCategoryNames;
  const entries = [
    { label: 'Lista de compras', icon: 'shopping-cart', route: 'ShoppingFlow' },
    { label: 'Casa', icon: 'home', route: 'HouseholdFlow' },
    { label: 'Perfil', icon: 'user', route: 'ProfileFlow' },
  ];

  React.useEffect(() => {
    Animated.timing(menuProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [menuProgress]);

  function closeMenu(afterClose?: () => void) {
    Animated.timing(menuProgress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
      if (afterClose) requestAnimationFrame(afterClose);
    });
  }

  function toggleStock() {
    if (stockOpen) {
      Animated.timing(stockProgress, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }).start(() => setStockOpen(false));
      return;
    }

    setStockOpen(true);
    Animated.timing(stockProgress, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }

  function toggleTasks() {
    const next = !tasksOpen;
    if (next) setTasksOpen(true);
    Animated.timing(tasksProgress, { toValue: next ? 1 : 0, duration: 150, useNativeDriver: true }).start(() => { if (!next) setTasksOpen(false); });
  }

  function goTo(route: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
    if (route === previousRoute && !params) {
      closeMenu();
      return;
    }
    closeMenu(() => navigation.navigate(route as never, params as never));
  }

  function openStorage(storage: { id: string; name: string; emoji: string }) {
    if (!effectiveId) return;
    goTo('StorageFlow', {
      screen: 'Fridge',
      params: {
        householdId: effectiveId,
        storageId: storage.id,
        storageName: storage.name,
        storageEmoji: storage.emoji,
      },
    });
  }

  return (
    <View style={styles.sideMenuRoot}>
      <Animated.View
        pointerEvents="none"
        style={[styles.sideMenuBackdropTint, { opacity: menuProgress }]}
      />
      <TouchableOpacity
        style={styles.sideMenuBackdrop}
        activeOpacity={1}
        onPress={() => closeMenu()}
      />
      <Animated.View
        style={[
          styles.sideMenuPanel,
          {
            opacity: menuProgress,
            transform: [
              {
                translateX: menuProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sideMenuHeader}>
          <Text style={styles.sideMenuKicker}>Colmeia</Text>
          <Text style={styles.sideMenuTitle}>Menu Principal</Text>
        </View>
        <View style={styles.sideMenuList}>
          <TouchableOpacity
            style={[styles.sideMenuItem, previousRoute === 'HomeFlow' && styles.sideMenuItemActive]}
            activeOpacity={0.78}
            onPress={() => goTo('HomeFlow')}
          >
            <View style={styles.sideMenuIconWrap}>
              <Feather
                name="grid"
                size={21}
                color={previousRoute === 'HomeFlow' ? '#fff' : Colors.textSecondary}
              />
            </View>
            <Text style={[styles.sideMenuText, previousRoute === 'HomeFlow' && styles.sideMenuTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideMenuItem}
            activeOpacity={0.78}
            onPress={toggleStock}
          >
            <View style={styles.sideMenuIconWrap}>
              <Feather name="box" size={21} color={Colors.textSecondary} />
            </View>
            <Text style={styles.sideMenuText}>Estoque</Text>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: stockProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              }}
            >
              <Feather
                name="chevron-down"
                size={22}
                color={stockOpen ? Colors.accent : Colors.textSecondary}
              />
            </Animated.View>
            <Text style={[styles.sideMenuChevron, stockOpen && styles.sideMenuChevronActive]}>
              {stockOpen ? '⌃' : '⌄'}
            </Text>
          </TouchableOpacity>

          {stockOpen && (
            <Animated.View
              style={[
                styles.sideSubmenu,
                {
                  opacity: stockProgress,
                  transform: [
                    {
                      translateY: stockProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {(storages ?? []).map((storage) => (
                <TouchableOpacity
                  key={storage.id}
                  style={[styles.sideSubmenuItem, activeStorageId === storage.id && styles.sideSubmenuItemActive]}
                  activeOpacity={0.72}
                  onPress={() => openStorage(storage)}
                >
                  <Text style={[styles.sideSubmenuText, activeStorageId === storage.id && styles.sideSubmenuTextActive]}>{storage.name}</Text>
                </TouchableOpacity>
              ))}
              {(storages ?? []).length === 0 && (
                <Text style={styles.sideSubmenuEmpty}>Nenhum estoque visivel</Text>
              )}
            </Animated.View>
          )}

          <TouchableOpacity style={styles.sideMenuItem} activeOpacity={0.78} onPress={toggleTasks}>
            <View style={styles.sideMenuIconWrap}><Feather name="check-square" size={21} color={Colors.textSecondary} /></View>
            <Text style={styles.sideMenuText}>Tarefas</Text>
            <Animated.View style={{ transform: [{ rotate: tasksProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}><Feather name="chevron-down" size={22} color={tasksOpen ? Colors.accent : Colors.textSecondary} /></Animated.View>
          </TouchableOpacity>
          {tasksOpen && (
            <Animated.View style={[styles.sideSubmenu, { opacity: tasksProgress, transform: [{ translateY: tasksProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
              {taskCategoryNames.map((category) => (
                <TouchableOpacity key={category} style={styles.sideSubmenuItem} activeOpacity={0.72} onPress={() => goTo('TasksFlow', { screen: 'TaskCategory', params: { category }, merge: false } as any)}>
                  <Text style={styles.sideSubmenuText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {entries.map((entry) => {
            const active = previousRoute === entry.route;
            return (
              <TouchableOpacity
                key={entry.route}
                style={[styles.sideMenuItem, active && styles.sideMenuItemActive]}
                activeOpacity={0.78}
                onPress={() => goTo(entry.route as keyof RootStackParamList)}
            >
                <View style={styles.sideMenuIconWrap}>
                  <Feather
                    name={entry.icon as any}
                    size={21}
                    color={active ? '#fff' : Colors.textSecondary}
                  />
                </View>
                <Text style={[styles.sideMenuText, active && styles.sideMenuTextActive]}>{entry.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function AppTabs() {
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
  menuButton: { paddingHorizontal: 12, paddingVertical: 4 },
  headerMenuButton: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: { color: Colors.accent, fontSize: 24, fontWeight: '700' },
  appHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  appHeaderRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appHeaderBack: {
    width: 34,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appHeaderTitleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  appHeaderTitleWrapNoBack: {
    paddingLeft: 0,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appHeaderRight: {
    minWidth: 28,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  storageHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  storageHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
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
  menuContainer: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  menuTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 18 },
  menuList: { gap: 10 },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: { fontSize: 20 },
  menuCardText: { flex: 1 },
  menuCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  menuCardDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  menuChevron: { fontSize: 24, color: Colors.textSecondary, fontWeight: '300' },
  polishedMenu: { flex: 1, backgroundColor: Colors.background },
  polishedMenuContent: { padding: 20, paddingTop: 56, paddingBottom: 36 },
  polishedMenuTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  polishedEyebrow: { fontSize: 13, fontWeight: '700', color: Colors.accent, textTransform: 'uppercase' },
  polishedTitle: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 28, color: Colors.textSecondary, lineHeight: 30 },
  homeHero: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    padding: 18,
    minHeight: 118,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 22,
  },
  homeHeroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  homeHeroText: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4, maxWidth: 220 },
  homeHeroIcon: { fontSize: 40 },
  polishedSection: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  dailyGrid: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  dailyCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 12,
    justifyContent: 'space-between',
  },
  dailyIcon: { fontSize: 22 },
  dailyTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  dailyDetail: { fontSize: 12, color: Colors.textSecondary },
  sideMenuRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  sideMenuBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,22,10,0.48)',
  },
  sideMenuBackdrop: { flex: 0.24 },
  sideMenuPanel: {
    flex: 0.76,
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: 34,
    borderBottomLeftRadius: 34,
    overflow: 'hidden',
    paddingTop: 72,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: -8, height: 0 },
    elevation: 12,
  },
  sideMenuHeader: {
    paddingHorizontal: 30,
    marginBottom: 22,
  },
  sideMenuKicker: {
    display: 'none',
  },
  sideMenuTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  sideMenuList: {
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  sideMenuItem: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 30,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: '#FFFCF7',
  },
  sideMenuItemActive: {
    backgroundColor: Colors.accent,
    borderBottomColor: Colors.accent,
  },
  sideMenuActiveBar: {
    display: 'none',
  },
  sideMenuIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMenuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '300',
    color: Colors.textSecondary,
  },
  sideMenuTextActive: { color: '#fff', fontWeight: '300' },
  sideMenuChevron: {
    display: 'none',
  },
  sideMenuChevronActive: { display: 'none' },
  sideSubmenu: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: '#F7F7F7',
  },
  sideSubmenuItem: {
    minHeight: 52,
    justifyContent: 'center',
    paddingLeft: 74,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  sideSubmenuItemActive: {
    backgroundColor: Colors.accent + '14',
  },
  sideSubmenuText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sideSubmenuTextActive: {
    color: Colors.accent,
  },
  sideSubmenuEmpty: {
    paddingVertical: 16,
    paddingLeft: 74,
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
