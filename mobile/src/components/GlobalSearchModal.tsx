import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useHouseholds } from '../hooks/useHouseholds';
import { useSelectedHousehold } from '../context/SelectedHouseholdContext';
import { useGlobalSearchModal } from '../context/GlobalSearchContext';
import { GlobalSearchResult, GlobalSearchResultType, ShoppingItem } from '../types';
import { useFridge } from '../hooks/useFridge';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { useHouseTasks } from '../hooks/useHouseTasks';
import { normalizeShoppingItemName } from '../utils/shoppingItemSimilarity';
import { api } from '../services/api';

type Props = {
  navigation: any;
};

type Row =
  | { id: string; rowType: 'section'; title: string }
  | { id: string; rowType: 'result'; result: GlobalSearchResult }
  | { id: string; rowType: 'action'; icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; route: string };

type SearchTab = 'all' | 'stock' | 'lists' | 'tasks' | 'actions';

const TYPE_LABELS: Record<GlobalSearchResultType, string> = {
  stock_item: 'Estoque',
  shopping_list: 'Lista',
  shopping_item: 'Item da lista',
  task: 'Tarefa',
};

const TYPE_ICONS: Record<GlobalSearchResultType, keyof typeof Feather.glyphMap> = {
  stock_item: 'box',
  shopping_list: 'shopping-cart',
  shopping_item: 'check-circle',
  task: 'check-square',
};

const TYPE_BADGES: Record<GlobalSearchResultType, string> = {
  stock_item: 'Estoque',
  shopping_list: 'Lista',
  shopping_item: 'Lista',
  task: 'Tarefa',
};

const TABS: { label: string; value: SearchTab }[] = [
  { label: 'Tudo', value: 'all' },
  { label: 'Estoque', value: 'stock' },
  { label: 'Listas', value: 'lists' },
  { label: 'Tarefas', value: 'tasks' },
  { label: 'Ações', value: 'actions' },
];

function matchesQuery(...values: Array<string | null | undefined>) {
  const normalizedValues = values.map((value) => normalizeShoppingItemName(value ?? ''));
  return (normalizedQuery: string) => normalizedValues.some((value) => value.includes(normalizedQuery));
}

export default function GlobalSearchModal({ navigation }: Props) {
  const { visible, closeSearch } = useGlobalSearchModal();
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const inputRef = useRef<TextInput>(null);
  const shouldFetchListItems = visible && !!effectiveId && debouncedQuery.trim().length >= 3 && (activeTab === 'all' || activeTab === 'lists');
  const { data: serverResults = [], isFetching: isServerFetching } = useGlobalSearch(effectiveId, debouncedQuery);
  const { data: fridgeItems = [], isFetching: isFridgeFetching } = useFridge(visible ? effectiveId : null);
  const { data: shoppingLists = [], isFetching: isListsFetching } = useShoppingLists(visible ? effectiveId : null);
  const { data: tasks = [], isFetching: isTasksFetching } = useHouseTasks(visible ? effectiveId : null);

  const listItemQueries = useQueries({
    queries: shoppingLists.map((list) => ({
      queryKey: ['global-search-list-items', effectiveId, list.id],
      queryFn: async () => {
        const response = await api.get<ShoppingItem[]>(`/households/${effectiveId}/shopping-lists/${list.id}/items`);
        return { list, items: response.data };
      },
      enabled: shouldFetchListItems,
      staleTime: 60_000,
    })),
  });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 260);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
      setActiveTab('all');
      return;
    }

    const timeout = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timeout);
  }, [visible]);

  const localResults = useMemo<GlobalSearchResult[]>(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2 || !effectiveId) return [];
    const normalizedQuery = normalizeShoppingItemName(trimmed);

    const stockResults: GlobalSearchResult[] = fridgeItems
      .filter((item) => matchesQuery(item.name, item.category, item.storage?.name)(normalizedQuery))
      .slice(0, 8)
      .map((item) => ({
        id: `stock:${item.id}`,
        type: 'stock_item',
        title: item.name,
        subtitle: [
          item.storage ? `${item.storage.emoji} ${item.storage.name}` : 'Estoque',
          item.category,
          `${item.quantity} ${item.unit ?? 'un'}`,
        ].filter(Boolean).join(' - '),
        target: {
          householdId: effectiveId,
          itemId: item.id,
          storageId: item.storageId,
          storageName: item.storage?.name ?? null,
          storageEmoji: item.storage?.emoji ?? null,
        },
      }));

    const shoppingListResults: GlobalSearchResult[] = shoppingLists
      .filter((list) => matchesQuery(list.name, list.place, list.category)(normalizedQuery))
      .slice(0, 6)
      .map((list) => ({
        id: `list:${list.id}`,
        type: 'shopping_list',
        title: list.name,
        subtitle: [list.urgent ? 'Urgente' : null, list.place, list.category, 'Lista de compras'].filter(Boolean).join(' - '),
        target: {
          householdId: effectiveId,
          listId: list.id,
          listName: list.name,
          listUrgent: list.urgent,
          listPlace: list.place,
          listCategory: list.category,
        },
      }));

    const shoppingItemResults: GlobalSearchResult[] = listItemQueries
      .flatMap((queryResult) => queryResult.data ? queryResult.data.items.map((item) => ({ item, list: queryResult.data!.list })) : [])
      .filter(({ item, list }) => matchesQuery(item.name, item.category, list.name)(normalizedQuery))
      .slice(0, 8)
      .map(({ item, list }) => ({
        id: `shopping-item:${item.id}`,
        type: 'shopping_item',
        title: item.name,
        subtitle: [
          item.checked ? 'Comprado' : 'Pendente',
          list.name,
          item.category,
          `${item.quantity} ${item.unit ?? 'un'}`,
        ].filter(Boolean).join(' - '),
        target: {
          householdId: effectiveId,
          itemId: item.id,
          listId: list.id,
          listName: list.name,
          listUrgent: list.urgent,
          listPlace: list.place,
          listCategory: list.category,
        },
      }));

    const taskResults: GlobalSearchResult[] = tasks
      .filter((task) => matchesQuery(task.title, task.description, task.category, task.assignedTo?.name, task.shoppingList?.name)(normalizedQuery))
      .slice(0, 8)
      .map((task) => ({
        id: `task:${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: [
          task.done ? 'Concluída' : task.status === 'in_progress' ? 'Em andamento' : 'Pendente',
          task.category,
          task.assignedTo?.name ? `Responsável: ${task.assignedTo.name}` : null,
          task.shoppingList?.name ? `Lista: ${task.shoppingList.name}` : null,
        ].filter(Boolean).join(' - '),
        target: {
          householdId: effectiveId,
          taskId: task.id,
          category: task.category,
        },
      }));

    return [...stockResults, ...shoppingListResults, ...shoppingItemResults, ...taskResults];
  }, [debouncedQuery, effectiveId, fridgeItems, listItemQueries, shoppingLists, tasks]);

  const results = useMemo(() => {
    const map = new Map<string, GlobalSearchResult>();
    [...serverResults, ...localResults].forEach((item) => map.set(item.id, item));
    return [...map.values()];
  }, [localResults, serverResults]);

  const actionRows = useMemo<Row[]>(() => {
    const trimmed = debouncedQuery.trim();
    const actions = [
      { id: 'action:storage', rowType: 'action' as const, icon: 'box' as const, title: 'Abrir estoques', subtitle: 'Geladeira, despensa e outros compartimentos', route: 'StorageFlow' },
      { id: 'action:shopping', rowType: 'action' as const, icon: 'shopping-cart' as const, title: 'Abrir listas de compras', subtitle: 'Listas, itens pendentes e comprados', route: 'ShoppingFlow' },
      { id: 'action:tasks', rowType: 'action' as const, icon: 'check-square' as const, title: 'Abrir tarefas', subtitle: 'Rotinas e checklist da casa', route: 'TasksFlow' },
      { id: 'action:household', rowType: 'action' as const, icon: 'home' as const, title: 'Abrir casa', subtitle: 'Membros, convites e configuracoes', route: 'HouseholdFlow' },
    ];
    if (trimmed.length >= 2) return [];
    return actions;
  }, [debouncedQuery]);

  const rows = useMemo<Row[]>(() => {
    const typeAllowed = (type: GlobalSearchResultType) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'stock') return type === 'stock_item';
      if (activeTab === 'lists') return type === 'shopping_list' || type === 'shopping_item';
      if (activeTab === 'tasks') return type === 'task';
      return false;
    };

    if (activeTab === 'actions') {
      return actionRows.length ? [{ id: 'section:actions', rowType: 'section', title: 'Ações' }, ...actionRows] : [];
    }

    const grouped = results.reduce<Record<GlobalSearchResultType, GlobalSearchResult[]>>((acc, item) => {
      if (!typeAllowed(item.type)) return acc;
      acc[item.type] = [...(acc[item.type] ?? []), item];
      return acc;
    }, {} as Record<GlobalSearchResultType, GlobalSearchResult[]>);

    const resultRows = (Object.keys(TYPE_LABELS) as GlobalSearchResultType[]).flatMap((type) => {
      const items = grouped[type] ?? [];
      if (items.length === 0) return [];
      return [
        { id: `section:${type}`, rowType: 'section' as const, title: TYPE_LABELS[type] },
        ...items.map((result) => ({ id: result.id, rowType: 'result' as const, result })),
      ];
    });

    if (activeTab !== 'all' || actionRows.length === 0) return resultRows;
    return [...resultRows, { id: 'section:actions', rowType: 'section', title: 'Ações' }, ...actionRows];
  }, [activeTab, actionRows, results]);

  const isFetching = isServerFetching || isFridgeFetching || isListsFetching || isTasksFetching || listItemQueries.some((item) => item.isFetching);

  function closeAndNavigate(callback: () => void) {
    closeSearch();
    requestAnimationFrame(callback);
  }

  function openResult(result: GlobalSearchResult) {
    const target = result.target;

    if (result.type === 'stock_item' && target.itemId) {
      closeAndNavigate(() => navigation.navigate('StorageFlow', {
        screen: 'FridgeItemDetail',
        params: { householdId: target.householdId, itemId: target.itemId, highlight: true },
      }));
      return;
    }

    if ((result.type === 'shopping_list' || result.type === 'shopping_item') && target.listId) {
      closeAndNavigate(() => navigation.navigate('ShoppingFlow', {
        screen: 'ShoppingListDetail',
        params: {
          householdId: target.householdId,
          listId: target.listId,
          listName: target.listName ?? 'Lista',
          listUrgent: target.listUrgent ?? false,
          listPlace: target.listPlace ?? null,
          listCategory: target.listCategory ?? null,
          highlightItemId: result.type === 'shopping_item' ? target.itemId : undefined,
          highlightList: result.type === 'shopping_list',
        },
      }));
      return;
    }

    if (result.type === 'task') {
      closeAndNavigate(() => navigation.navigate('TasksFlow', target.category
        ? { screen: 'TaskCategory', params: { category: target.category, highlightTaskId: target.taskId } }
        : { screen: 'TasksEntry', params: { highlightTaskId: target.taskId } }));
    }
  }

  function openShortcut(route: string) {
    closeAndNavigate(() => navigation.navigate(route as never));
  }

  function renderRow({ item }: { item: Row }) {
    if (item.rowType === 'section') {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
    }

    if (item.rowType === 'action') {
      return (
        <TouchableOpacity style={styles.resultRow} onPress={() => openShortcut(item.route)} activeOpacity={0.74}>
          <View style={styles.actionIcon}>
            <Feather name={item.icon} size={17} color={Colors.accent} />
          </View>
          <View style={styles.resultTextBlock}>
            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.resultSubtitle} numberOfLines={2}>{item.subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    const icon = TYPE_ICONS[item.result.type];
    return (
      <TouchableOpacity style={styles.resultRow} onPress={() => openResult(item.result)} activeOpacity={0.74}>
        <View style={styles.resultIcon}>
          <Feather name={icon} size={17} color={Colors.accent} />
        </View>
        <View style={styles.resultTextBlock}>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.result.title}</Text>
          <Text style={styles.resultSubtitle} numberOfLines={2}>{item.result.subtitle}</Text>
        </View>
        <Text style={styles.routeBadge}>{TYPE_BADGES[item.result.type]}</Text>
      </TouchableOpacity>
    );
  }

  const showEmptySearch = debouncedQuery.trim().length >= 2 && !isFetching && rows.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSearch}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSearch} />
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Buscar</Text>
              <Text style={styles.panelSubtitle}>Itens, listas, tarefas e atalhos</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeSearch} activeOpacity={0.72}>
              <Feather name="x" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Feather name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar em tudo"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={19} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroller}
            contentContainerStyle={styles.tabsRow}
            keyboardShouldPersistTaps="handled"
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, activeTab === tab.value && styles.tabActive]}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.76}
              >
                <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {query.trim().length < 2 ? (
            <FlatList
              data={[{ id: 'section:actions', rowType: 'section' as const, title: 'Ações rápidas' }, ...actionRows]}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.resultsWrap}>
              {isFetching && rows.length === 0 ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color={Colors.accent} />
                </View>
              ) : null}
              {showEmptySearch ? (
                <View style={styles.centerState}>
                  <Text style={styles.emptyTitle}>Nada encontrado</Text>
                  <Text style={styles.emptyText}>Tente buscar por item, lista, estoque, categoria ou tarefa.</Text>
                </View>
              ) : null}
              {rows.length > 0 ? (
                <FlatList
                  data={rows}
                  keyExtractor={(item) => item.id}
                  renderItem={renderRow}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
              ) : null}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 56,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61,32,0,0.36)',
  },
  panel: {
    maxHeight: '86%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  panelHeader: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.card,
  },
  panelTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  panelSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  tabsScroller: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.card,
  },
  tabsRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  searchRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  resultsWrap: {
    minHeight: 180,
    maxHeight: 560,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 7,
    backgroundColor: Colors.card,
  },
  resultRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '16',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '16',
  },
  resultTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  resultTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  routeBadge: {
    maxWidth: 70,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.accent + '12',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.accent,
    fontWeight: '800',
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
