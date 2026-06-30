import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge, useFridgeActivity } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { useShoppingActivity, useShoppingLists } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/AppTabs';
import { useHouseTasks, useHouseTaskActivity } from '../../hooks/useHouseTasks';
import { FridgeItem } from '../../types';
import GlobalSearchModal from '../../components/GlobalSearchModal';
import AlertsSheet from '../../components/AlertsSheet';
import { useGlobalSearchModal } from '../../context/GlobalSearchContext';
import HomeHeader from './components/HomeHeader';
import { ExpiringItemsCard, QuickActionsCard, TodayIntro, TodayTasksCard, UrgentListsCard } from './components/HomeCards';
import { HelpSheet } from '../../components/HelpSheet';
import { AttentionSummaryModal } from './components/HomeSheets';
import { useHomeAlerts } from './hooks/useHomeAlerts';
import { useHomeToday } from './hooks/useHomeToday';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const HELP_SECTIONS = [
  {
    title: 'Home',
    body: 'Veja o que precisa de atenção hoje, crie itens ou listas rapidamente e acompanhe as últimas movimentações da casa.',
  },
  {
    title: 'Estoques',
    body: 'Use o menu para entrar em Geladeira, Freezer, Despensa, Limpeza, Banheiro ou Lavanderia. Cada estoque tem seus próprios itens, categorias e histórico.',
  },
  {
    title: 'Adicionar item',
    body: 'Ao adicionar um produto, informe quantidade, unidade, estoque, categoria e validade quando fizer sentido. Categorias mudam conforme o estoque escolhido.',
  },
  {
    title: 'Item acabou',
    body: 'No card do item, toque no X. Você pode somente remover ou remover e mandar para uma lista de compras.',
  },
  {
    title: 'Lista de compras',
    body: 'Crie listas por mercado, farmácia ou situação. Marque uma lista como urgente na criação ou edição para ela aparecer em destaque na Home.',
  },
  {
    title: 'Da lista para o estoque',
    body: 'Depois de comprar um item, envie para o estoque escolhendo o compartimento e a categoria correta. O item sai da lista e entra no estoque escolhido.',
  },
  {
    title: 'Atividades',
    body: 'O sino mostra novidades feitas por outras pessoas da casa. Ao abrir, o contador some. Itens novos aparecem com uma bolinha no card.',
  },
  {
    title: 'Casa e membros',
    body: 'Na área Casa você convida pessoas, vê membros, gerencia estoques e ajusta categorias. Cada casa mantém dados separados.',
  },
  {
    title: 'Categorias',
    body: 'As categorias são organizadas por estoque. Você pode adaptar para sua rotina sem afetar itens já cadastrados.',
  },
  {
    title: 'Checklist da casa',
    body: 'Use tarefas para coisas que não são estoque, como trocar filtro, comprar gás, lavar toalhas ou lembrar de manutenções.',
  },
  {
    title: 'Notificações',
    body: 'O app avisa mudanças importantes da casa compartilhada, como item adicionado na lista, produto acabando ou validade próxima.',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openSearch } = useGlobalSearchModal();
  const { selectedHouseholdId, isSelectedHouseholdReady, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;

  const household = households?.find((h) => h.id === effectiveId);
  const { data: fridgeItems } = useFridge(effectiveId);
  const { data: fridgeActivity } = useFridgeActivity(effectiveId);
  const { data: storages } = useStorages(effectiveId, { includeHidden: true });
  const { data: shoppingLists } = useShoppingLists(effectiveId);
  const { data: shoppingActivity = [] } = useShoppingActivity(effectiveId);
  const { data: houseTasks = [] } = useHouseTasks(effectiveId);
  const { data: taskActivity = [] } = useHouseTaskActivity(effectiveId);

  const [helpVisible, setHelpVisible] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const [attentionModalVisible, setAttentionModalVisible] = useState(false);
  const {
    firstName,
    todayLabel,
    todayKey,
    urgentLists,
    priorityTasks,
    expiringItems,
    todayAttentionCount,
    formatShortDate,
  } = useHomeToday({
    userName: user?.name,
    userId: user?.id,
    fridgeItems,
    houseTasks,
    shoppingLists,
  });
  const { alertSections, activityUnreadCount, markAllSeen: markHomeAlertsSeen } = useHomeAlerts({
    householdId: effectiveId,
    localUserId: user?.id,
    fridgeItems,
    fridgeActivity,
    houseTasks,
    taskActivity,
    shoppingLists,
    shoppingActivity,
    onOpenStockItem: openExpiringItem,
    onOpenTask: openTask,
    onOpenShoppingList: (list) => navigation.navigate('HomeShoppingListDetail', {
      householdId: list.householdId,
      listId: list.id,
      listName: list.name,
      listUrgent: list.urgent,
      highlightList: true,
    }),
    onOpenStockActivity: openActivityStock,
  });
  const helpSheet = useBottomSheetMotion({
    onOpen: () => setHelpVisible(true),
    onClose: () => setHelpVisible(false),
  });
  const alertsSheet = useBottomSheetMotion({
    onOpen: () => {
      setAlertsVisible(true);
      markHomeAlertsSeen();
    },
    onClose: () => setAlertsVisible(false),
  });

  function openMenu() {
    navigation.getParent()?.navigate('Menu' as never);
  }

  function openShopping() {
    navigation.getParent()?.navigate('ShoppingFlow' as never);
  }

  function openAddStockItem() {
    if (!effectiveId) return;
    navigation.navigate('AddFridgeItem', { householdId: effectiveId });
  }

  function openCreateShoppingList() {
    if (!effectiveId) return;
    navigation.navigate('HomeCreateShoppingList', { householdId: effectiveId });
  }

  function openExpiringItem(item: FridgeItem) {
    const storage = item.storage ?? (storages ?? []).find((candidate) => candidate.id === item.storageId);
    if (!effectiveId || !storage) return;

    (navigation.getParent() as any)?.navigate('StorageFlow', {
      screen: 'Fridge',
      params: {
        householdId: effectiveId,
        storageId: storage.id,
        storageName: storage.name,
        storageEmoji: storage.emoji,
        highlightItemId: item.id,
      },
    });
  }

  function openTask(task: { id: string; category?: string | null }) {
    (navigation.getParent() as any)?.navigate('TasksFlow', task.category
      ? { screen: 'TaskCategory', params: { category: task.category, highlightTaskId: task.id } }
      : { screen: 'TasksEntry', params: { highlightTaskId: task.id } });
  }

  function openActivityStock(event: { storageId?: string | null; storageName?: string | null; storageEmoji?: string | null }) {
    const storage = (storages ?? []).find((item) => item.id === event.storageId)
      ?? (storages ?? []).find((item) => item.name === event.storageName);
    const targetStorageId = storage?.id ?? event.storageId;
    const targetStorageName = storage?.name ?? event.storageName;
    const targetStorageEmoji = storage?.emoji ?? event.storageEmoji ?? '';
    if (!effectiveId || !targetStorageId || !targetStorageName) return;

    setAlertsVisible(false);
    requestAnimationFrame(() => {
      (navigation.getParent() as any)?.navigate('StorageFlow', {
        screen: 'Fridge',
        params: {
          householdId: effectiveId,
          storageId: targetStorageId,
          storageName: targetStorageName,
          storageEmoji: targetStorageEmoji,
        },
      });
    });
  }

  function selectHousehold(householdId: string) {
    requestAnimationFrame(() => setSelectedHouseholdId(householdId));
  }

  function openHouseholdSelector() {
    const options = households ?? [];
    if (options.length <= 1) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((item) => item.name), 'Cancelar'],
          cancelButtonIndex: options.length,
          userInterfaceStyle: 'light',
        },
        (index) => {
          if (index < options.length) selectHousehold(options[index].id);
        },
      );
      return;
    }

    Alert.alert('Escolher casa', undefined, options.map((item) => ({
      text: item.name,
      onPress: () => selectHousehold(item.id),
    })), { cancelable: true });
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader
        topInset={insets.top}
        todayLabel={todayLabel}
        firstName={firstName}
        activityUnreadCount={activityUnreadCount}
        onSearch={openSearch}
        onHelp={helpSheet.open}
        onAlerts={() => effectiveId && alertsSheet.open()}
        onMenu={openMenu}
      />

      <TodayIntro
        householdName={household?.name}
        householdCount={households?.length ?? 0}
        attentionCount={todayAttentionCount}
        onSelectHousehold={openHouseholdSelector}
        onOpenAttention={() => setAttentionModalVisible(true)}
      />

      <QuickActionsCard
        disabled={!effectiveId}
        onAddStockItem={openAddStockItem}
        onCreateShoppingList={openCreateShoppingList}
      />

      <ExpiringItemsCard
        items={expiringItems}
        formatDate={formatShortDate}
        onOpenItem={openExpiringItem}
      />

      <TodayTasksCard
        tasks={priorityTasks}
        todayKey={todayKey}
        onOpenTasks={() => navigation.getParent()?.navigate('TasksFlow' as never)}
        onOpenTask={openTask}
      />

      <UrgentListsCard
        lists={urgentLists}
        onOpenShopping={openShopping}
        onOpenList={(list) => navigation.navigate('HomeShoppingListDetail', {
          householdId: list.householdId,
          listId: list.id,
          listName: list.name,
          listUrgent: list.urgent,
          highlightList: true,
        })}
      />

    </ScrollView>

    <HelpSheet
      visible={helpVisible}
      height={helpSheet.height}
      translateY={helpSheet.translateY}
      panHandlers={helpSheet.panHandlers}
      sections={HELP_SECTIONS}
      onClose={helpSheet.close}
    />

    <AlertsSheet
      visible={alertsVisible}
      height={alertsSheet.height}
      translateY={alertsSheet.translateY}
      panHandlers={alertsSheet.panHandlers}
      subtitle={household?.name ? `Casa inteira · ${household.name}` : 'Casa inteira'}
      sections={alertSections}
      onClose={alertsSheet.close}
    />

    <AttentionSummaryModal
      visible={attentionModalVisible}
      expiringItems={expiringItems}
      tasks={priorityTasks}
      urgentLists={urgentLists}
      formatDate={formatShortDate}
      onClose={() => setAttentionModalVisible(false)}
      onOpenItem={openExpiringItem}
      onOpenTask={openTask}
      onOpenList={(list) => navigation.navigate('HomeShoppingListDetail', {
        householdId: list.householdId,
        listId: list.id,
        listName: list.name,
        listUrgent: list.urgent,
        highlightList: true,
      })}
    />

    <GlobalSearchModal navigation={navigation.getParent?.() ?? navigation} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40, minHeight: '100%' },
});

