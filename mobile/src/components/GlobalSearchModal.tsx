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
import { Typography } from '../theme/typography';

type Props = {
  navigation: any;
};

type Row =
  | { id: string; rowType: 'section'; title: string }
  | { id: string; rowType: 'result'; result: GlobalSearchResult };

type SearchTab = 'all' | 'stock' | 'lists' | 'tasks';
type SearchContext =
  | { area: 'stock'; storageId?: string | null }
  | { area: 'shopping'; listId?: string | null }
  | { area: 'tasks'; category?: string | null }
  | { area: 'general' };

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
];

function activeRouteFromState(state: any): any {
  if (!state?.routes?.length) return null;
  const route = state.routes[state.index ?? 0];
  return route?.state ? activeRouteFromState(route.state) : route;
}

function rootFlowFromState(state: any): any {
  if (!state?.routes?.length) return null;
  return state.routes[state.index ?? 0] ?? null;
}

function getSearchContext(navigation: any): SearchContext {
  const state = navigation?.getState?.();
  const rootFlow = rootFlowFromState(state);
  const activeRoute = activeRouteFromState(state);
  const flowName = rootFlow?.name;
  const routeName = activeRoute?.name;
  const params = activeRoute?.params ?? rootFlow?.params?.params ?? {};

  if (flowName === 'StorageFlow') {
    return { area: 'stock', storageId: params.storageId ?? null };
  }

  if (flowName === 'ShoppingFlow') {
    return { area: 'shopping', listId: params.listId ?? null };
  }

  if (flowName === 'TasksFlow') {
    return { area: 'tasks', category: params.category ?? null };
  }

  if (routeName === 'HomeShoppingListDetail') {
    return { area: 'shopping', listId: params.listId ?? null };
  }

  return { area: 'general' };
}

function typeOrderForContext(context: SearchContext) {
  if (context.area === 'stock') return ['stock_item', 'shopping_list', 'shopping_item', 'task'] as GlobalSearchResultType[];
  if (context.area === 'shopping') return ['shopping_list', 'shopping_item', 'stock_item', 'task'] as GlobalSearchResultType[];
  if (context.area === 'tasks') return ['task', 'stock_item', 'shopping_list', 'shopping_item'] as GlobalSearchResultType[];
  return Object.keys(TYPE_LABELS) as GlobalSearchResultType[];
}

function priorityForContext(result: GlobalSearchResult, context: SearchContext) {
  if (context.area === 'stock') {
    if (result.type === 'stock_item' && context.storageId && result.target.storageId === context.storageId) return 0;
    if (result.type === 'stock_item') return 1;
    return 2;
  }

  if (context.area === 'shopping') {
    if ((result.type === 'shopping_list' || result.type === 'shopping_item') && context.listId && result.target.listId === context.listId) return 0;
    if (result.type === 'shopping_list' || result.type === 'shopping_item') return 1;
    return 2;
  }

  if (context.area === 'tasks') {
    if (result.type === 'task' && context.category && result.target.category === context.category) return 0;
    if (result.type === 'task') return 1;
    return 2;
  }

  return 1;
}

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
  const searchContext = getSearchContext(navigation);
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
        ].filter(Boolean).join(' · '),
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
        subtitle: [list.urgent ? 'Urgente' : null, list.place, list.category, 'Lista de compras'].filter(Boolean).join(' · '),
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
        ].filter(Boolean).join(' · '),
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
        ].filter(Boolean).join(' · '),
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

  const resolvedResults = useMemo(() => {
    return results.map((result) => {
      if (result.type === 'stock_item' && result.target.itemId) {
        const item = fridgeItems.find((candidate) => candidate.id === result.target.itemId);
        if (!item) return result;
        return {
          ...result,
          target: {
            ...result.target,
            storageId: result.target.storageId ?? item.storageId ?? item.storage?.id ?? null,
            storageName: result.target.storageName ?? item.storage?.name ?? null,
            storageEmoji: result.target.storageEmoji ?? item.storage?.emoji ?? null,
          },
        };
      }

      if ((result.type === 'shopping_list' || result.type === 'shopping_item') && result.target.listId) {
        const list = shoppingLists.find((candidate) => candidate.id === result.target.listId);
        if (!list) return result;
        return {
          ...result,
          target: {
            ...result.target,
            listName: result.target.listName ?? list.name,
            listUrgent: result.target.listUrgent ?? list.urgent,
            listPlace: result.target.listPlace ?? list.place ?? null,
            listCategory: result.target.listCategory ?? list.category ?? null,
          },
        };
      }

      if (result.type === 'task' && result.target.taskId) {
        const task = tasks.find((candidate) => candidate.id === result.target.taskId);
        if (!task) return result;
        return {
          ...result,
          target: {
            ...result.target,
            category: result.target.category ?? task.category ?? null,
          },
        };
      }

      return result;
    });
  }, [fridgeItems, results, shoppingLists, tasks]);

  const rows = useMemo<Row[]>(() => {
    const typeAllowed = (type: GlobalSearchResultType) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'stock') return type === 'stock_item';
      if (activeTab === 'lists') return type === 'shopping_list' || type === 'shopping_item';
      if (activeTab === 'tasks') return type === 'task';
      return false;
    };

    const prioritizedResults = [...resolvedResults].sort((a, b) => priorityForContext(a, searchContext) - priorityForContext(b, searchContext));
    const grouped = prioritizedResults.reduce<Record<GlobalSearchResultType, GlobalSearchResult[]>>((acc, item) => {
      if (!typeAllowed(item.type)) return acc;
      acc[item.type] = [...(acc[item.type] ?? []), item];
      return acc;
    }, {} as Record<GlobalSearchResultType, GlobalSearchResult[]>);

    const resultRows = typeOrderForContext(searchContext).flatMap((type) => {
      const items = grouped[type] ?? [];
      if (items.length === 0) return [];
      return [
        { id: `section:${type}`, rowType: 'section' as const, title: TYPE_LABELS[type] },
        ...items.map((result) => ({ id: result.id, rowType: 'result' as const, result })),
      ];
    });

    return resultRows;
  }, [activeTab, resolvedResults, searchContext]);

  const isFetching = isServerFetching || isFridgeFetching || isListsFetching || isTasksFetching || listItemQueries.some((item) => item.isFetching);

  function closeAndNavigate(callback: () => void) {
    closeSearch();
    requestAnimationFrame(callback);
  }

  function openResult(result: GlobalSearchResult) {
    const target = result.target;

    if (result.type === 'stock_item' && target.itemId && target.storageId) {
      closeAndNavigate(() => navigation.navigate('StorageFlow', {
        screen: 'Fridge',
        params: {
          householdId: target.householdId,
          storageId: target.storageId,
          storageName: target.storageName ?? 'Estoque',
          storageEmoji: target.storageEmoji ?? '📦',
          highlightItemId: target.itemId,
        },
      }));
      return;
    }

    if (result.type === 'stock_item') {
      closeAndNavigate(() => navigation.navigate('StorageFlow' as never));
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
      return;
    }
  }

  function renderRow({ item }: { item: Row }) {
    if (item.rowType === 'section') {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
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

          <View style={styles.body}>
            {query.trim().length < 2 ? (
              <View style={styles.centerState}>
                <Text style={styles.emptyTitle}>Digite para buscar</Text>
                <Text style={styles.emptyText}>Encontre itens, listas e tarefas da casa.</Text>
              </View>
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
                    key="search-results"
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 64,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  panel: {
    maxHeight: '86%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  panelHeader: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.card,
  },
  panelTitle: {
    fontFamily: Typography.display,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  panelSubtitle: {
    fontFamily: Typography.body,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabsScroller: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.card,
  },
  tabsRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tab: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontFamily: Typography.rounded,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  searchRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    fontFamily: Typography.body,
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  body: {
    minHeight: 264,
    maxHeight: 560,
    backgroundColor: Colors.card,
  },
  resultsWrap: {
    flex: 1,
    minHeight: 264,
    backgroundColor: Colors.card,
  },
  sectionTitle: {
    fontFamily: Typography.title,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 8,
    backgroundColor: Colors.card,
  },
  resultRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '16',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontFamily: Typography.rounded,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontFamily: Typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  routeBadge: {
    fontFamily: Typography.title,
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
    fontFamily: Typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontFamily: Typography.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
