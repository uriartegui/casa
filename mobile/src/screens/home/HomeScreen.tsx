import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Animated, Dimensions, PanResponder, Platform, ScrollView, StyleSheet, View } from 'react-native';
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
import { AttentionSummaryModal, HelpSheet } from './components/HomeSheets';
import { useHomeAlerts } from './hooks/useHomeAlerts';

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

function formatShortDate(date: string) {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}`;
}

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
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [attentionModalVisible, setAttentionModalVisible] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const activityCollapsedHeight = Math.round(screenHeight * 0.74);
  const activityExpandedHeight = Math.round(screenHeight - 64);
  const activityCloseThreshold = Math.round(screenHeight * 0.48);
  const activitySheetHeight = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const activitySheetTranslateY = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const activityHeightRef = React.useRef(activityCollapsedHeight);
  const activityDragStartHeight = React.useRef(activityCollapsedHeight);
  const helpSheetHeight = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const helpSheetTranslateY = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const helpHeightRef = React.useRef(activityCollapsedHeight);
  const helpDragStartHeight = React.useRef(activityCollapsedHeight);

  React.useEffect(() => {
    const listener = activitySheetHeight.addListener(({ value }) => {
      activityHeightRef.current = value;
    });
    return () => activitySheetHeight.removeListener(listener);
  }, [activitySheetHeight]);

  React.useEffect(() => {
    const listener = helpSheetHeight.addListener(({ value }) => {
      helpHeightRef.current = value;
    });
    return () => helpSheetHeight.removeListener(listener);
  }, [helpSheetHeight]);

  const firstName = user?.name?.split(' ')[0] ?? 'você';
  const today = React.useMemo(() => new Date(), []);
  const todayLabel = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const urgentLists = React.useMemo(() => (shoppingLists ?? []).filter((list) => list.urgent), [shoppingLists]);
  const todayKey = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const priorityTasks = React.useMemo(() => (
    houseTasks
      .filter((task) => !task.done && (task.dueDate === todayKey || (task.dueDate && task.dueDate < todayKey) || task.assignedToId === user?.id))
      .slice(0, 3)
  ), [houseTasks, todayKey, user?.id]);
  const expiringItems = React.useMemo(() => {
    const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return (fridgeItems ?? [])
      .filter((item) => {
        if (!item.expirationDate) return false;
        const expiration = new Date(`${item.expirationDate}T00:00:00`);
        const diffDays = Math.ceil((expiration.getTime() - todayAtStart.getTime()) / 86400000);
        return diffDays <= 7;
      })
      .sort((a, b) => {
        const aTime = a.expirationDate ? new Date(`${a.expirationDate}T00:00:00`).getTime() : Infinity;
        const bTime = b.expirationDate ? new Date(`${b.expirationDate}T00:00:00`).getTime() : Infinity;
        return aTime - bTime;
      });
  }, [fridgeItems, today]);
  const todayAttentionCount = expiringItems.length + priorityTasks.length + urgentLists.length;
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

    setActivityModalVisible(false);
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

  function animateActivitySheet(toValue: number, onEnd?: () => void) {
    Animated.spring(activitySheetHeight, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => onEnd?.());
  }

  function animateHelpSheet(toValue: number, onEnd?: () => void) {
    Animated.spring(helpSheetHeight, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => onEnd?.());
  }

  function openHelpModal() {
    helpSheetHeight.setValue(activityCollapsedHeight);
    helpSheetTranslateY.setValue(activityCollapsedHeight);
    helpHeightRef.current = activityCollapsedHeight;
    setHelpVisible(true);
    requestAnimationFrame(() => {
      Animated.spring(helpSheetTranslateY, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 3,
      }).start();
    });
  }

  function closeHelpModal() {
    Animated.timing(helpSheetTranslateY, {
      toValue: Math.max(helpHeightRef.current, activityCollapsedHeight),
      duration: 190,
      useNativeDriver: false,
    }).start(() => {
      setHelpVisible(false);
      helpSheetHeight.setValue(activityCollapsedHeight);
      helpSheetTranslateY.setValue(activityCollapsedHeight);
      helpHeightRef.current = activityCollapsedHeight;
    });
  }

  function openActivityModal() {
    activitySheetHeight.setValue(activityCollapsedHeight);
    activitySheetTranslateY.setValue(activityCollapsedHeight);
    activityHeightRef.current = activityCollapsedHeight;
    setActivityModalVisible(true);
    markHomeAlertsSeen();
    requestAnimationFrame(() => {
      Animated.spring(activitySheetTranslateY, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 3,
      }).start();
    });
  }

  function closeActivityModal() {
    Animated.timing(activitySheetTranslateY, {
      toValue: Math.max(activityHeightRef.current, activityCollapsedHeight),
      duration: 190,
      useNativeDriver: false,
    }).start(() => {
      setActivityModalVisible(false);
      activitySheetHeight.setValue(activityCollapsedHeight);
      activitySheetTranslateY.setValue(activityCollapsedHeight);
      activityHeightRef.current = activityCollapsedHeight;
    });
  }

  const activitySheetPanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      activityDragStartHeight.current = activityHeightRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const nextHeight = Math.max(0, Math.min(activityExpandedHeight, activityDragStartHeight.current - gesture.dy));
      activitySheetHeight.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentHeight = activityHeightRef.current;
      const projectedHeight = Math.max(0, Math.min(activityExpandedHeight, activityDragStartHeight.current - gesture.dy));
      const midpoint = (activityCollapsedHeight + activityExpandedHeight) / 2;
      if (projectedHeight < activityCloseThreshold || gesture.moveY > screenHeight * 0.72) {
        closeActivityModal();
        return;
      }
      if (gesture.dy < -35 || gesture.vy < -0.75 || projectedHeight > midpoint || currentHeight > midpoint) {
        animateActivitySheet(activityExpandedHeight);
        return;
      }
      animateActivitySheet(activityCollapsedHeight);
    },
  }), [activityCloseThreshold, activityCollapsedHeight, activityExpandedHeight, activitySheetHeight, screenHeight]);

  const helpSheetPanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      helpDragStartHeight.current = helpHeightRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const nextHeight = Math.max(0, Math.min(activityExpandedHeight, helpDragStartHeight.current - gesture.dy));
      helpSheetHeight.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentHeight = helpHeightRef.current;
      const projectedHeight = Math.max(0, Math.min(activityExpandedHeight, helpDragStartHeight.current - gesture.dy));
      const midpoint = (activityCollapsedHeight + activityExpandedHeight) / 2;
      if (projectedHeight < activityCloseThreshold || gesture.moveY > screenHeight * 0.72) {
        closeHelpModal();
        return;
      }
      if (gesture.dy < -35 || gesture.vy < -0.75 || projectedHeight > midpoint || currentHeight > midpoint) {
        animateHelpSheet(activityExpandedHeight);
        return;
      }
      animateHelpSheet(activityCollapsedHeight);
    },
  }), [activityCloseThreshold, activityCollapsedHeight, activityExpandedHeight, helpSheetHeight, screenHeight]);

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
        onHelp={openHelpModal}
        onActivity={() => effectiveId && openActivityModal()}
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
      height={helpSheetHeight}
      translateY={helpSheetTranslateY}
      panHandlers={helpSheetPanResponder.panHandlers}
      sections={HELP_SECTIONS}
      onClose={closeHelpModal}
    />

    <AlertsSheet
      visible={activityModalVisible}
      height={activitySheetHeight}
      translateY={activitySheetTranslateY}
      panHandlers={activitySheetPanResponder.panHandlers}
      subtitle={household?.name ? `Casa inteira · ${household.name}` : 'Casa inteira'}
      sections={alertSections}
      onClose={closeActivityModal}
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
