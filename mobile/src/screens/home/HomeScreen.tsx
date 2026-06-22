import React, { useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge, useFridgeActivity } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/AppTabs';
import ActivityTimeline from '../../components/ActivityTimeline';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { useHouseTasks, useHouseTaskActivity } from '../../hooks/useHouseTasks';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;
type ActivityPeriodFilter = 'all' | 'today' | '7d' | '30d';
type ActivityKindFilter = 'all' | 'added' | 'removed' | 'updated' | 'from_list' | 'to_list';

const HELP_SECTIONS = [
  {
    title: 'Home',
    body: 'Escolha a casa ativa, veja os totais do estoque e das listas, crie itens rapidamente e acompanhe alertas urgentes ou produtos vencendo.',
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
  const { selectedHouseholdId, isSelectedHouseholdReady, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;

  const household = households?.find((h) => h.id === effectiveId);
  const { data: fridgeItems } = useFridge(effectiveId);
  const { data: fridgeActivity } = useFridgeActivity(effectiveId);
  const { data: storages } = useStorages(effectiveId, { includeHidden: true });
  const { data: shoppingLists } = useShoppingLists(effectiveId);
  const { data: houseTasks = [] } = useHouseTasks(effectiveId);
  const { data: taskActivity = [] } = useHouseTaskActivity(effectiveId);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activityNewSince, setActivityNewSince] = useState<string | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriodFilter>('all');
  const [activityStorageId, setActivityStorageId] = useState<string>('all');
  const [activityKind, setActivityKind] = useState<ActivityKindFilter>('all');
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

  const firstName = user?.name?.split(' ')[0] ?? 'voce';
  const today = new Date();
  const todayLabel = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const urgentLists = (shoppingLists ?? []).filter((list) => list.urgent);
  const todayKey = new Date().toISOString().slice(0, 10);
  const priorityTasks = houseTasks.filter((task) => !task.done && (task.dueDate === todayKey || (task.dueDate && task.dueDate < todayKey) || task.assignedToId === user?.id)).slice(0, 3);
  const expiringItems = (fridgeItems ?? [])
    .filter((item) => {
      if (!item.expirationDate) return false;
      const expiration = new Date(`${item.expirationDate}T00:00:00`);
      const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.ceil((expiration.getTime() - todayAtStart.getTime()) / 86400000);
      return diffDays <= 7;
    })
    .sort((a, b) => {
      const aTime = a.expirationDate ? new Date(`${a.expirationDate}T00:00:00`).getTime() : Infinity;
      const bTime = b.expirationDate ? new Date(`${b.expirationDate}T00:00:00`).getTime() : Infinity;
      return aTime - bTime;
    });
  const filteredFridgeActivity = React.useMemo(() => {
    const now = new Date();
    const todayAtStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const cutoff = activityPeriod === 'today'
      ? todayAtStart
      : activityPeriod === '7d'
        ? Date.now() - 7 * 86400000
        : activityPeriod === '30d'
          ? Date.now() - 30 * 86400000
          : null;

    return (fridgeActivity ?? []).filter((event) => {
      if (cutoff && new Date(event.createdAt).getTime() < cutoff) return false;

      if (activityStorageId !== 'all') {
        const storage = (storages ?? []).find((item) => item.id === activityStorageId);
        const matchesById = event.storageId === activityStorageId;
        const matchesLegacyName = storage?.name && event.storageName === storage.name;
        if (!matchesById && !matchesLegacyName) return false;
      }

      if (activityKind === 'added') return event.action === 'added' && !event.fromShoppingListName;
      if (activityKind === 'from_list') return event.action === 'added' && !!event.fromShoppingListName;
      if (activityKind === 'removed') return event.action === 'removed' && !event.toShoppingListName;
      if (activityKind === 'to_list') return event.action === 'removed' && !!event.toShoppingListName;
      if (activityKind === 'updated') return event.action === 'updated';
      return true;
    });
  }, [activityKind, activityPeriod, activityStorageId, fridgeActivity, storages]);
  const activeActivityFilterCount = [
    activityPeriod !== 'all',
    activityStorageId !== 'all',
    activityKind !== 'all',
  ].filter(Boolean).length;
  const {
    lastSeenAt: stockActivitySeenAt,
    markSeen: markStockActivitySeen,
    unseenCount: stockActivityUnreadCount,
  } = useActivitySeen('stock', effectiveId, fridgeActivity ?? [], user?.id);
  const { unseenCount: taskActivityUnreadCount, markSeen: markTaskActivitySeen, lastSeenAt: taskActivitySeenAt } = useActivitySeen('tasks', effectiveId, taskActivity, user?.id);
  const activityUnreadCount = stockActivityUnreadCount + taskActivityUnreadCount;

  function openMenu() {
    navigation.getParent()?.navigate('Menu' as never);
  }

  function openShopping() {
    navigation.getParent()?.navigate('ShoppingFlow' as never);
  }

  function openStock() {
    navigation.getParent()?.navigate('Menu' as never);
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
    setDropdownOpen(false);
    requestAnimationFrame(() => setSelectedHouseholdId(householdId));
  }

  function resetActivityFilters() {
    setActivityPeriod('all');
    setActivityStorageId('all');
    setActivityKind('all');
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
    setActivityNewSince([stockActivitySeenAt, taskActivitySeenAt].filter(Boolean).sort()[0] ?? null);
    activitySheetHeight.setValue(activityCollapsedHeight);
    activitySheetTranslateY.setValue(activityCollapsedHeight);
    activityHeightRef.current = activityCollapsedHeight;
    setActivityModalVisible(true);
    markStockActivitySeen();
    markTaskActivitySeen();
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
      onScrollBeginDrag={() => setDropdownOpen(false)}
    >
      {dropdownOpen && (
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        />
      )}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.homeHeaderBar}>
          <View style={styles.homeHeaderIdentity}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={25} color="#fff" />
            </View>
            <View style={styles.homeHeaderTextBlock}>
              <Text style={styles.homeHeaderDate}>{todayLabel}</Text>
              <Text style={styles.headerGreeting}>
                Ola, <Text style={styles.headerGreetingName}>{firstName}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.homeHeaderActions}>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={openHelpModal}>
              <Feather name="help-circle" size={23} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
              <Feather name="message-square" size={23} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
              onPress={() => effectiveId && openActivityModal()}
            >
              <Feather name="bell" size={23} color={Colors.textPrimary} />
              {activityUnreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{activityUnreadCount > 99 ? '99+' : activityUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={openMenu} activeOpacity={0.7}>
              <Feather name="menu" size={30} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.hero} pointerEvents="box-none">
        {dropdownOpen && (
          <TouchableOpacity
            style={styles.heroDropdownBackdrop}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          />
        )}
        {household && (
          <View style={styles.householdWrapper}>
            <TouchableOpacity
              style={styles.householdRow}
              activeOpacity={(households?.length ?? 0) > 1 ? 0.7 : 1}
              onPress={() => {
                if ((households?.length ?? 0) <= 1) return;
                setDropdownOpen((o) => !o);
              }}
            >
              <Text style={styles.householdName}>🏠 {household.name}</Text>
              {(households?.length ?? 0) > 1 && (
                <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.accent} />
              )}
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.householdDropdown}>
                {(households ?? []).map((h) => {
                  return (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.householdOption, h.id === effectiveId && styles.householdOptionActive]}
                      onPress={() => selectHousehold(h.id)}
                    >
                      <Text style={[styles.householdOptionText, h.id === effectiveId && styles.householdOptionTextActive]}>
                        {h.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <Text style={styles.householdMeta}>
          {fridgeItems?.length ?? 0} itens no estoque
          {'  ·  '}
          {shoppingLists?.length ?? 0} {shoppingLists?.length === 1 ? 'lista pendente' : 'listas pendentes'}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => effectiveId && navigation.navigate('AddFridgeItem', { householdId: effectiveId })}
          disabled={!effectiveId}
        >
          <Text style={styles.quickBtnIcon}>{'\u{1F4E6}'}</Text>
          <Text style={styles.quickBtnText}>+ Estoque</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => effectiveId && navigation.navigate('HomeCreateShoppingList', { householdId: effectiveId })}
          disabled={!effectiveId}
        >
          <Text style={styles.quickBtnIcon}>{'\u{1F6D2}'}</Text>
          <Text style={styles.quickBtnText}>+ Lista</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>{'\u{1F6A8}'}</Text>
            <Text style={styles.cardTitle}>Urgente</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={openShopping}>
            <Text style={styles.cardLink}>Ver lista {'->'}</Text>
          </TouchableOpacity>
        </View>

        {urgentLists.length > 0 ? (
          urgentLists.slice(0, 3).map((list) => (
            <TouchableOpacity
              key={list.id}
              style={styles.itemRow}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('HomeShoppingListDetail', {
                householdId: list.householdId,
                listId: list.id,
                listName: list.name,
                listUrgent: list.urgent,
              })}
            >
              <View style={styles.itemDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{list.name}</Text>
                <Text style={styles.itemStorage}>{list.itemCount} {list.itemCount === 1 ? 'item' : 'itens'}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyCardText}>Nenhuma lista urgente.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><View style={styles.cardTitleRow}><Text style={styles.cardTitle}>Tarefas de hoje</Text></View><TouchableOpacity onPress={() => navigation.getParent()?.navigate('TasksFlow' as never)}><Text style={styles.cardLink}>Ver tarefas {'->'}</Text></TouchableOpacity></View>
        {priorityTasks.length ? priorityTasks.map((task) => <TouchableOpacity key={task.id} style={styles.itemRow} onPress={() => navigation.getParent()?.navigate('TasksFlow' as never)}><View style={[styles.itemDot, { backgroundColor: task.dueDate && task.dueDate < todayKey ? Colors.destructive : Colors.accent }]} /><View style={{ flex: 1 }}><Text style={styles.itemName}>{task.title}</Text><Text style={styles.itemStorage}>{task.assignedTo?.name ? task.assignedTo.name : task.assignmentType === 'all' ? 'Todos' : 'Sem responsavel'}</Text></View></TouchableOpacity>) : <Text style={styles.emptyCardText}>Nenhuma tarefa importante hoje.</Text>}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>{'\u26A0'}</Text>
            <Text style={styles.cardTitle}>Vencendo</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={openStock}>
            <Text style={styles.cardLink}>Ver estoque {'->'}</Text>
          </TouchableOpacity>
        </View>

        {expiringItems.length > 0 ? (
          expiringItems.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: '#F0A500' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStorage}>{item.storage?.name ?? 'Estoque'}</Text>
              </View>
              <Text style={styles.itemQty}>{item.expirationDate ? formatShortDate(item.expirationDate) : ''}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyCardText}>Nenhum item proximo do vencimento.</Text>
        )}
      </View>


    </ScrollView>

    <Modal
      visible={helpVisible}
      transparent
      animationType="fade"
      onRequestClose={closeHelpModal}
    >
      <View style={styles.activityOverlay}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={closeHelpModal}
        />
        <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY: helpSheetTranslateY }] }]}>
          <Animated.View style={[styles.activitySheet, { height: helpSheetHeight }]}>
        <View style={styles.sheetDragArea} {...helpSheetPanResponder.panHandlers}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetDragHint} />
        </View>
        <View style={styles.helpHeader}>
          <View>
            <Text style={styles.helpTitle}>Ajuda</Text>
            <Text style={styles.helpSubtitle}>Guia rápido da Colmeia</Text>
          </View>
        </View>

        <ScrollView
          style={styles.helpScroll}
          contentContainerStyle={styles.helpContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.helpIntroCard}>
            <Text style={styles.helpIntroTitle}>Como a casa fica organizada</Text>
            <Text style={styles.helpIntroText}>
              A Colmeia junta estoque, lista de compras, tarefas e atividades da casa para todo mundo saber o que tem, o que acabou e quem mexeu.
            </Text>
          </View>

          {HELP_SECTIONS.map((section, index) => (
            <View key={section.title} style={styles.helpSection}>
              <View style={styles.helpSectionNumber}>
                <Text style={styles.helpSectionNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.helpSectionBody}>
                <Text style={styles.helpSectionTitle}>{section.title}</Text>
                <Text style={styles.helpSectionText}>{section.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>

    <Modal
      visible={activityModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeActivityModal}
    >
      <View style={styles.activityOverlay}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={closeActivityModal}
        />
        <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY: activitySheetTranslateY }] }]}>
          <Animated.View style={[styles.activitySheet, { height: activitySheetHeight }]}>
          <View style={styles.sheetDragArea} {...activitySheetPanResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetDragHint} />
          </View>
          <View style={styles.activitySheetHeader}>
            <Text style={styles.activitySheetTitle}>Atividades da casa</Text>
            <View style={styles.activityHeaderActions}>
              <TouchableOpacity
                style={[styles.filterButton, activeActivityFilterCount > 0 && styles.filterButtonActive]}
                onPress={() => setFilterModalVisible(true)}
                activeOpacity={0.75}
              >
                <Feather name="filter" size={14} color={activeActivityFilterCount > 0 ? '#fff' : Colors.accent} />
                <Text style={[styles.filterButtonText, activeActivityFilterCount > 0 && styles.filterButtonTextActive]}>
                  Filtros{activeActivityFilterCount > 0 ? ` (${activeActivityFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {false && (
            <View style={styles.filtersPanel}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Filtrar por</Text>
                {activeActivityFilterCount > 0 && (
                  <TouchableOpacity onPress={resetActivityFilters} activeOpacity={0.75}>
                    <Text style={styles.clearFiltersText}>Limpar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.filterLabel}>Data</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                {[
                  ['all', 'Tudo'],
                  ['today', 'Hoje'],
                  ['7d', '7 dias'],
                  ['30d', '30 dias'],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.filterChip, activityPeriod === value && styles.filterChipActive]}
                    onPress={() => setActivityPeriod(value as ActivityPeriodFilter)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, activityPeriod === value && styles.filterChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Estoque</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                <TouchableOpacity
                  style={[styles.filterChip, activityStorageId === 'all' && styles.filterChipActive]}
                  onPress={() => setActivityStorageId('all')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, activityStorageId === 'all' && styles.filterChipTextActive]}>Todos</Text>
                </TouchableOpacity>
                {(storages ?? []).map((storage) => (
                  <TouchableOpacity
                    key={storage.id}
                    style={[styles.filterChip, activityStorageId === storage.id && styles.filterChipActive]}
                    onPress={() => setActivityStorageId(storage.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, activityStorageId === storage.id && styles.filterChipTextActive]}>{storage.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Ação</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                {[
                  ['all', 'Tudo'],
                  ['added', 'Entrada'],
                  ['removed', 'Saída'],
                  ['updated', 'Edição'],
                  ['from_list', 'Veio da lista'],
                  ['to_list', 'Foi para lista'],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.filterChip, activityKind === value && styles.filterChipActive]}
                    onPress={() => setActivityKind(value as ActivityKindFilter)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, activityKind === value && styles.filterChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <ActivityTimeline
            fridgeEvents={filteredFridgeActivity}
            taskEvents={taskActivity}
            scope="stock"
            showFilters={false}
            showScopeFilter={false}
            emptyText="Nenhuma atividade nos estoques."
            onEventPress={openActivityStock}
            newSince={activityNewSince}
            localUserId={user?.id}
          />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>

    <Modal
      visible={filterModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.filterModalOverlay}>
        <TouchableOpacity style={styles.filterModalBackdrop} activeOpacity={1} onPress={() => setFilterModalVisible(false)} />
        <View style={styles.filterModalCard}>
          <View style={styles.filterSectionHeader}>
            <Text style={styles.filterModalTitle}>Filtros</Text>
            {activeActivityFilterCount > 0 && (
              <TouchableOpacity onPress={resetActivityFilters} activeOpacity={0.75}>
                <Text style={styles.clearFiltersText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.filterLabel}>Data</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {[
              ['all', 'Tudo'],
              ['today', 'Hoje'],
              ['7d', '7 dias'],
              ['30d', '30 dias'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, activityPeriod === value && styles.filterChipActive]}
                onPress={() => setActivityPeriod(value as ActivityPeriodFilter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, activityPeriod === value && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Estoque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            <TouchableOpacity
              style={[styles.filterChip, activityStorageId === 'all' && styles.filterChipActive]}
              onPress={() => setActivityStorageId('all')}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, activityStorageId === 'all' && styles.filterChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {(storages ?? []).map((storage) => (
              <TouchableOpacity
                key={storage.id}
                style={[styles.filterChip, activityStorageId === storage.id && styles.filterChipActive]}
                onPress={() => setActivityStorageId(storage.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, activityStorageId === storage.id && styles.filterChipTextActive]}>{storage.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Ação</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {[
              ['all', 'Tudo'],
              ['added', 'Entrada'],
              ['removed', 'Saída'],
              ['updated', 'Edição'],
              ['from_list', 'Veio da lista'],
              ['to_list', 'Foi para lista'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, activityKind === value && styles.filterChipActive]}
                onPress={() => setActivityKind(value as ActivityKindFilter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, activityKind === value && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.filterApplyButton} onPress={() => setFilterModalVisible(false)} activeOpacity={0.8}>
            <Text style={styles.filterApplyButtonText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40, minHeight: '100%' },

  header: {
    marginHorizontal: -20,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  homeHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  homeHeaderIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeHeaderTextBlock: { flex: 1 },
  homeHeaderDate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  headerGreeting: { fontSize: 17, color: Colors.textSecondary },
  headerGreetingName: { color: Colors.textPrimary, fontWeight: '800' },
  homeHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 },
  helpScreen: { flex: 1, backgroundColor: Colors.background },
  helpHeader: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  helpTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  helpSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  helpScroll: { flex: 1 },
  helpContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  helpIntroCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  helpIntroTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  helpIntroText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  helpSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  helpSectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  helpSectionNumberText: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  helpSectionBody: { flex: 1 },
  helpSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  helpSectionText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  hero: { marginTop: -4, marginBottom: 22, zIndex: 20 },
  heroDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    elevation: 10,
  },
  greeting: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  dashboardCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.separator,
    zIndex: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  dashboardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dashboardStats: { flexDirection: 'row', gap: 10 },
  dashboardStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashboardStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  dashboardStatLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  householdName: { fontSize: 14, fontWeight: '600', color: Colors.accent },
  householdMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 8 },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 6,
  },
  householdWrapper: { alignSelf: 'flex-start', minWidth: 162, zIndex: 30, elevation: 12 },
  householdDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 5,
    minWidth: 162,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '22',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 999,
  },
  householdOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 4,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 12,
  },
  householdOptionActive: { backgroundColor: Colors.accent + '15' },
  householdOptionText: { fontSize: 13, color: Colors.textPrimary },
  householdOptionTextActive: { color: Colors.accent, fontWeight: '600' },

  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  quickBtnIcon: { fontSize: 22 },
  quickBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  cardTitleIcon: { fontSize: 16, lineHeight: 20 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: Colors.textPrimary },
  cardLink: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  emptyCardText: { fontSize: 14, color: Colors.textSecondary, paddingTop: 10 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    gap: 10,
  },
  itemDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  itemName: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  itemStorage: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemQty: { fontSize: 13, color: Colors.textSecondary },
  loadingLines: { gap: 10, paddingVertical: 8 },
  activityOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  activitySheetMotion: {
    zIndex: 2,
    elevation: 24,
  },
  activitySheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 24,
  },
  sheetDragArea: {
    minHeight: 36,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E7DCCB',
    alignSelf: 'center',
  },
  sheetDragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  activitySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  activitySheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  activityHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterButtonText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  filterButtonTextActive: { color: '#fff' },
  filtersPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.card,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterSectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  clearFiltersText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  filterChipsRow: { gap: 8, paddingRight: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filterModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  filterModalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  filterModalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  filterApplyButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  filterApplyButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },

});
