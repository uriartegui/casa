import React, { useState } from 'react';
import {
  Animated, View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFridge, useFridgeActivity, useRemoveFridgeItem, useUpdateFridgeItem } from '../../hooks/useFridge';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { useCategories } from '../../hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useToast } from '../../context/ToastContext';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';
import { expirationLabel } from '../../utils/expiration';
import { formatBrDate } from '../../utils/dateUtils';
import { FridgeItemSkeleton } from '../../components/Skeleton';
import { showFinishedFridgeItemAlert } from '../../utils/fridgeFinishedFlow';
import NativeSelect from '../../components/NativeSelect';
import { HelpSheet } from '../home/components/HomeSheets';
import AlertsSheet from '../../components/AlertsSheet';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { buildStockActivityAlerts, buildStockAttention, countAlerts } from '../../utils/alertCenter';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const STOCK_HELP_HIGHLIGHTS = [
  { icon: 'box' as const, title: 'Itens', body: 'Quantidades, unidades e quem cadastrou.' },
  { icon: 'alert-triangle' as const, title: 'Validade', body: 'Destaques para vencidos e próximos.' },
  { icon: 'tag' as const, title: 'Categorias', body: 'Filtros para achar tudo mais rápido.' },
];

const STOCK_HELP_SECTIONS = [
  {
    title: 'Adicionar item',
    body: 'Use o botão de adicionar para registrar produto, quantidade, unidade, validade e categoria.',
  },
  {
    title: 'Filtrar categorias',
    body: 'Toque em uma categoria no topo para ver só aquele grupo de itens. Use "Todos" para voltar.',
  },
  {
    title: 'Itens vencidos',
    body: 'Quando houver validade vencida ou próxima, o app mostra alertas no card do item para você agir antes de perder.',
  },
  {
    title: 'Categorizar itens',
    body: 'Quando itens entram sem categoria, o aviso "Categorizar itens" ajuda a organizar tudo em lote.',
  },
  {
    title: 'Item acabou',
    body: 'Toque no X do item para remover do estoque ou mandar direto para uma lista de compras.',
  },
  {
    title: 'Atualizar dados',
    body: 'Puxe a lista para baixo quando quiser buscar as informações mais recentes da casa.',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'Fridge'>;
  route: RouteProp<FridgeStackParamList, 'Fridge'>;
};

export default function FridgeScreen({ navigation, route }: Props) {
  const {
    householdId: effectiveId,
    storageId: effectiveStorageId,
    highlightItemId,
  } = route.params;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const highlightAnim = React.useRef(new Animated.Value(0)).current;
  const [categorizeVisible, setCategorizeVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<Record<string, string>>({});

  const { data: items, isLoading: loadingItems, refetch } = useFridge(effectiveId, effectiveStorageId);
  const { data: fridgeActivity = [] } = useFridgeActivity(effectiveId);
  const removeItem = useRemoveFridgeItem(effectiveId ?? '');
  const updateItem = useUpdateFridgeItem(effectiveId ?? '');
  const { data: categories } = useCategories(effectiveId, effectiveStorageId);
  const { data: shoppingLists, isLoading: loadingShoppingLists } = useShoppingLists(effectiveId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const {
    lastSeenAt: stockActivitySeenAt,
    markSeen: markStockActivitySeen,
  } = useActivitySeen(`stock:${effectiveStorageId}`, effectiveId, fridgeActivity.filter((event) => event.storageId === effectiveStorageId), undefined);
  const helpSheet = useBottomSheetMotion({
    onOpen: () => setHelpVisible(true),
    onClose: () => setHelpVisible(false),
  });
  const alertsSheet = useBottomSheetMotion({
    onOpen: () => {
      setAlertsVisible(true);
      markStockActivitySeen();
    },
    onClose: () => setAlertsVisible(false),
  });


  const alertSections = React.useMemo(() => [
    {
      title: 'Precisa de atenção',
      items: buildStockAttention(items ?? [], {
        storageId: effectiveStorageId,
        storageName: route.params.storageName,
        onOpenItem: (item) => navigation.navigate('FridgeItemDetail', { itemId: item.id, householdId: effectiveId! }),
      }),
      emptyText: 'Nenhum item vencido ou sem categoria neste estoque.',
    },
    {
      title: 'Atividades novas',
      items: buildStockActivityAlerts(fridgeActivity, {
        storageId: effectiveStorageId,
        since: stockActivitySeenAt,
        onOpenEvent: (event) => event.storageId && navigation.navigate('Fridge', {
          householdId: effectiveId!,
          storageId: event.storageId,
          storageName: event.storageName ?? route.params.storageName,
          storageEmoji: event.storageEmoji ?? route.params.storageEmoji,
        }),
      }),
      emptyText: 'Nenhuma atividade nova neste estoque.',
    },
  ], [effectiveId, effectiveStorageId, fridgeActivity, items, navigation, route.params.storageEmoji, route.params.storageName, stockActivitySeenAt]);
  const alertCount = countAlerts(alertSections);

  React.useLayoutEffect(() => {
    (navigation as any).setOptions({
      headerAlert: () => (
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={alertsSheet.open}
          activeOpacity={0.72}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="bell" size={23} color={Colors.textPrimary} />
          {alertCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{alertCount > 99 ? '99+' : alertCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={helpSheet.open}
            activeOpacity={0.72}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="help-circle" size={23} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.getParent()?.navigate('Menu' as never)}
            activeOpacity={0.72}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="menu" size={30} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [alertCount, navigation, alertsSheet.open, helpSheet.open]);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  React.useEffect(() => {
    if (!highlightItemId || !items?.some((item) => item.id === highlightItemId)) return;
    highlightAnim.setValue(0);
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.delay(650),
      Animated.timing(highlightAnim, { toValue: 0, duration: 950, useNativeDriver: false }),
    ]).start();
  }, [highlightAnim, highlightItemId, items]);

  const availableCategories = React.useMemo(() => {
    if (!items) return [];
    const cats = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    const base = selectedCategory ? items.filter((i) => i.category === selectedCategory) : items;
    return [...base].sort((a, b) => {
      const aD = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
      const bD = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
      return aD - bD;
    });
  }, [items, selectedCategory]);

  const sections = React.useMemo(() => {
    if (selectedCategory) {
      return [{ category: selectedCategory, data: filteredItems }];
    }
    const groups: Record<string, FridgeItem[]> = {};
    const uncategorized: FridgeItem[] = [];
    filteredItems.forEach((item) => {
      if (item.category) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      } else {
        uncategorized.push(item);
      }
    });
    const result = Object.entries(groups).map(([cat, data]) => ({ category: cat, data }));
    if (uncategorized.length > 0) result.push({ category: 'Outros', data: uncategorized });
    return result;
  }, [filteredItems, selectedCategory]);

  type FlatRow = { _header: true; category: string; id: string } | FridgeItem;
  const flatData = React.useMemo((): FlatRow[] => {
    const rows: FlatRow[] = [];
    for (const section of sections) {
      rows.push({ _header: true, category: section.category, id: `__header__${section.category}` });
      for (const item of section.data) rows.push(item);
    }
    return rows;
  }, [sections]);
  const categoryCount = availableCategories.length;
  const summaryText = `${filteredItems.length} ${filteredItems.length === 1 ? 'item cadastrado' : 'itens cadastrados'}${categoryCount > 0 ? ` em ${categoryCount} ${categoryCount === 1 ? 'categoria' : 'categorias'}` : ''}`;
  const uncategorizedItems = React.useMemo(
    () => (items ?? []).filter((item) => !item.category),
    [items],
  );

  function confirmItemFinished(item: FridgeItem) {
    showFinishedFridgeItemAlert({
      householdId: effectiveId,
      item,
      shoppingLists,
      shoppingListsLoading: loadingShoppingLists,
      removeItem: removeItem.mutateAsync,
      queryClient,
      showToast,
    });
  }

  function openCategorizeModal() {
    setCategoryDraft({});
    setCategorizeVisible(true);
  }

  async function handleSaveCategories() {
    const entries = Object.entries(categoryDraft).filter(([, category]) => !!category);
    if (entries.length === 0) {
      setCategorizeVisible(false);
      return;
    }

    try {
      await Promise.all(entries.map(([itemId, category]) => (
        updateItem.mutateAsync({ itemId, category })
      )));
      setCategorizeVisible(false);
      setCategoryDraft({});
    } catch {
      Alert.alert('Erro', 'Não foi possível categorizar os itens.');
    }
  }

  function renderItem({ item }: { item: FridgeItem }) {
    const exp = item.expirationDate ? expirationLabel(item.expirationDate) : null;
    const borderColor = exp?.status === 'expired'
      ? Colors.destructive
      : exp?.status === 'warning'
        ? '#F59E0B'
        : exp?.status === 'ok'
          ? Colors.success
          : 'transparent';
    const badgeBg = exp?.status === 'expired'
      ? Colors.destructive + '18'
      : exp?.status === 'warning'
        ? '#F59E0B18'
        : exp?.status === 'ok'
          ? Colors.success + '18'
          : null;
    const badgeText = exp?.status === 'expired'
      ? Colors.destructive
      : exp?.status === 'warning'
        ? '#F59E0B'
        : Colors.success;
    const isHighlighted = item.id === highlightItemId;
    const highlightStyle = isHighlighted
      ? {
        backgroundColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.card, Colors.accent + '24'],
        }),
        borderColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.separator, Colors.accent],
        }),
      }
      : null;

    return (
        <AnimatedTouchableOpacity
          style={[styles.itemRow, { borderLeftColor: borderColor, borderLeftWidth: 3 }, highlightStyle]}
          onPress={() => navigation.navigate('FridgeItemDetail', { itemId: item.id, householdId: effectiveId! })}
          activeOpacity={0.7}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.expirationDate && (
              <Text style={styles.itemDate}>Validade: {formatBrDate(item.expirationDate)}</Text>
            )}
            {!item.expirationDate && item.createdBy && <Text style={styles.itemMeta}>por {item.createdBy.name}</Text>}
          </View>
          <View style={styles.itemRight}>
            {exp && badgeBg && (
              <View style={[styles.expBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.expBadgeText, { color: badgeText }]}>{exp.text}</Text>
              </View>
            )}
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
            </View>
            <TouchableOpacity
              style={styles.finishedButton}
              onPress={(event) => {
                event.stopPropagation();
                confirmItemFinished(item);
              }}
              activeOpacity={0.7}
              accessibilityLabel={`${item.name} acabou`}
            >
              <Text style={styles.finishedButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </AnimatedTouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {availableCategories.length > 0 && (
        <View style={styles.categoryPickerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.categoryPicker}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {availableCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loadingItems ? (
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => <FridgeItemSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if ('_header' in item && item._header) {
              return <Text style={styles.sectionGroupHeader}>{item.category}</Text>;
            }
            return renderItem({ item: item as FridgeItem });
          }}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionLabel}>{summaryText}</Text>
              {uncategorizedItems.length > 0 && (
                <TouchableOpacity style={styles.categorizeButton} onPress={openCategorizeModal} activeOpacity={0.78}>
                  <Text style={styles.categorizeButtonText}>Categorizar itens</Text>
                  <View style={styles.categorizeBadge}>
                    <Text style={styles.categorizeBadgeText}>{uncategorizedItems.length}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Vazio</Text>
              <Text style={styles.emptySubtitle}>Adicione itens tocando no botao abaixo</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddFridgeItem', {
            householdId: effectiveId,
            storageId: effectiveStorageId ?? undefined,
          })}
        >
          <Text style={styles.buttonText}>+ Adicionar item</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={categorizeVisible} transparent animationType="slide" onRequestClose={() => setCategorizeVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setCategorizeVisible(false)} />
          <View style={styles.categorizeSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Categorizar itens</Text>
            <Text style={styles.sheetSubtitle}>Escolha uma categoria para os itens que chegaram sem categoria.</Text>

            {(categories ?? []).length === 0 ? (
              <View style={styles.categorizeEmpty}>
                <Text style={styles.emptyTitle}>Nenhuma categoria criada</Text>
                <Text style={styles.emptySubtitle}>Crie categorias na area Casa para organizar este estoque.</Text>
              </View>
            ) : (
              <FlatList
                style={styles.categorizeList}
                contentContainerStyle={styles.categorizeContent}
                data={uncategorizedItems}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.categorizeItem}>
                    <View style={styles.categorizeItemHeader}>
                      <Text style={styles.categorizeItemName}>{item.name}</Text>
                      <Text style={styles.categorizeItemQty}>{item.quantity} {item.unit ?? 'un'}</Text>
                    </View>
                    <NativeSelect
                      value={categoryDraft[item.id] ?? ''}
                      placeholder="Escolher categoria"
                      options={(categories ?? []).map((category) => ({ label: category.label, value: category.label }))}
                      onChange={(category) => setCategoryDraft((current) => ({ ...current, [item.id]: category }))}
                    />
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.button, updateItem.isPending && styles.buttonDisabled]}
              onPress={handleSaveCategories}
              disabled={updateItem.isPending}
            >
              {updateItem.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Salvar categorias</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={false} transparent animationType="fade" onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <TouchableOpacity style={styles.helpBackdrop} activeOpacity={1} onPress={() => setHelpVisible(false)} />
          <View style={styles.helpSheet}>
            <View style={styles.helpDragArea}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.helpHeader}>
              <View>
                <Text style={styles.helpTitle}>Ajuda</Text>
                <Text style={styles.helpSubtitle}>Estoque: {route.params.storageName}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.helpFloatingClose} onPress={() => setHelpVisible(false)} activeOpacity={0.72}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView style={styles.helpScroll} contentContainerStyle={styles.helpContent} showsVerticalScrollIndicator={false}>
              <View style={styles.helpIntroCard}>
                <Text style={styles.helpIntroTitle}>Como este estoque funciona</Text>
                <Text style={styles.helpIntroText}>
                  Aqui você acompanha o que existe em casa, vê validade, organiza por categoria e decide rapidamente quando um item acabou.
                </Text>
              </View>

              <View style={styles.helpHighlightGrid}>
                {[
                  { icon: 'box' as const, title: 'Itens', body: 'Quantidades, unidades e quem cadastrou.' },
                  { icon: 'alert-triangle' as const, title: 'Validade', body: 'Destaques para vencidos e próximos.' },
                  { icon: 'tag' as const, title: 'Categorias', body: 'Filtros para achar tudo mais rápido.' },
                ].map((item) => (
                  <View key={item.title} style={styles.helpHighlightCard}>
                    <View style={styles.helpHighlightIcon}>
                      <Feather name={item.icon} size={17} color={Colors.accent} />
                    </View>
                    <Text style={styles.helpHighlightTitle}>{item.title}</Text>
                    <Text style={styles.helpHighlightText}>{item.body}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.helpGroupTitle}>Funções do estoque</Text>
              {[
                ['plus-circle', 'Adicionar item', 'Use o botão de adicionar para registrar produto, quantidade, unidade, validade e categoria.'],
                ['tag', 'Filtrar categorias', 'Toque em uma categoria no topo para ver só aquele grupo de itens. Use "Todos" para voltar.'],
                ['alert-triangle', 'Itens vencidos', 'Quando houver validade vencida ou próxima, o app mostra alertas no card do item para você agir antes de perder.'],
                ['layers', 'Categorizar itens', 'Quando itens entram sem categoria, o aviso "Categorizar itens" ajuda a organizar tudo em lote.'],
                ['x-circle', 'Item acabou', 'Toque no X do item para remover do estoque ou mandar direto para uma lista de compras.'],
                ['refresh-cw', 'Atualizar dados', 'Puxe a lista para baixo quando quiser buscar as informações mais recentes da casa.'],
              ].map(([, title, body], index) => (
                <View key={title} style={styles.helpSection}>
                  <View style={styles.helpSectionNumber}>
                    <Text style={styles.helpSectionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.helpSectionBody}>
                    <Text style={styles.helpSectionTitle}>{title}</Text>
                    <Text style={styles.helpSectionText}>{body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <HelpSheet
        visible={helpVisible}
        height={helpSheet.height}
        translateY={helpSheet.translateY}
        panHandlers={helpSheet.panHandlers}
        sections={STOCK_HELP_SECTIONS}
        subtitle={`Estoque: ${route.params.storageName}`}
        introTitle="Como este estoque funciona"
        introText="Aqui você acompanha o que existe em casa, vê validade, organiza por categoria e decide rapidamente quando um item acabou."
        highlights={STOCK_HELP_HIGHLIGHTS}
        groupTitle="Funções do estoque"
        onClose={helpSheet.close}
      />

      <AlertsSheet
        visible={alertsVisible}
        height={alertsSheet.height}
        translateY={alertsSheet.translateY}
        panHandlers={alertsSheet.panHandlers}
        subtitle={`Estoque: ${route.params.storageName}`}
        sections={alertSections}
        onClose={alertsSheet.close}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 8 },
  storagePicker: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: 16, height: 52,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  storagePickerContent: {
    alignItems: 'center', paddingHorizontal: 16, gap: 8,
  },
  storageChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
  },
  storageChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  storageChipEmoji: { fontSize: 14 },
  storageChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  storageChipTextActive: { color: '#fff' },

  storageAddChip: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  storageAddChipText: { fontSize: 18, color: Colors.textSecondary, lineHeight: 22 },
  list: { padding: 16, gap: 2, flexGrow: 1, paddingBottom: 24 },
  listHeader: { gap: 10, marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  categorizeButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categorizeButtonText: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  categorizeBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  categorizeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  sectionGroupHeader: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 4 },
  itemRow: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.separator, marginBottom: 8,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  finishedButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedButtonText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', lineHeight: 18 },
  expBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  expBadgeText: { fontSize: 11, fontWeight: '700' },
  categoryPickerWrapper: {
    height: 48,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  categoryPicker: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
  },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  categoryChipTextActive: { color: '#fff' },
  itemMeta: { fontSize: 12, color: Colors.textSecondary },
  itemDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  itemMetaExpired: { color: Colors.destructive, fontWeight: '700' },
  itemMetaWarning: { color: '#F59E0B', fontWeight: '600' },
  itemMetaOk: { color: '#34C759', fontWeight: '500' },
  quantityBadge: {
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.separator,
  },
  quantityText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  emptyContainer: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(61,32,0,0.42)',
  },
  categorizeSheet: {
    maxHeight: '88%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  sheetSubtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  categorizeList: { maxHeight: 440 },
  categorizeContent: { gap: 10, paddingBottom: 8 },
  categorizeItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 12,
    gap: 9,
  },
  categorizeItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  categorizeItemName: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  categorizeItemQty: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  categorizeEmpty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  helpOverlay: { flex: 1, justifyContent: 'flex-end' },
  helpBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  helpSheet: {
    maxHeight: '84%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 24,
  },
  helpDragArea: {
    minHeight: 36,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
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
  helpFloatingClose: {
    position: 'absolute',
    top: 42,
    right: 16,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
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
  helpHighlightGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  helpHighlightCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.card,
    padding: 12,
  },
  helpHighlightIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '14',
    marginBottom: 8,
  },
  helpHighlightTitle: { fontSize: 13, lineHeight: 17, fontWeight: '900', color: Colors.textPrimary },
  helpHighlightText: { fontSize: 11, lineHeight: 15, color: Colors.textSecondary, marginTop: 4 },
  helpGroupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
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
  helpHero: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    padding: 14,
  },
  helpHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  helpHeroText: { flex: 1, minWidth: 0 },
  helpHeroTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900', color: Colors.textPrimary },
  helpHeroBody: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary, marginTop: 4 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  helpRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '14',
  },
  helpRowText: { flex: 1, minWidth: 0 },
  helpRowTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900', color: Colors.textPrimary },
  helpRowBody: { fontSize: 12, lineHeight: 17, color: Colors.textSecondary, marginTop: 2 },
});

