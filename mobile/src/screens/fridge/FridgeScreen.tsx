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
import { useToast } from '../../context/ToastContext';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { Typography } from '../../theme/typography';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';
import { expirationLabel } from '../../utils/expiration';
import { formatBrDate } from '../../utils/dateUtils';
import { FridgeItemSkeleton } from '../../components/Skeleton';
import { showFinishedFridgeItemAlert } from '../../utils/fridgeFinishedFlow';
import NativeSelect from '../../components/NativeSelect';
import { HelpSheet } from '../../components/HelpSheet';
import AlertsSheet from '../../components/AlertsSheet';
import { HeaderActionGroup, HeaderIconButton } from '../../components/HeaderActions';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { useStockAlerts } from './hooks/useStockAlerts';
import { STOCK_HELP_HIGHLIGHTS, STOCK_HELP_SECTIONS } from './helpContent';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
  const { data: allStockItems } = useFridge(effectiveId);
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


  const openAlertItem = React.useCallback((item: FridgeItem) => {
    if (!effectiveId) return;
    navigation.navigate('FridgeItemDetail', { itemId: item.id, householdId: effectiveId });
  }, [effectiveId, navigation]);
  const openAlertActivity = React.useCallback((event: { storageId?: string | null; storageName?: string | null; storageEmoji?: string | null }) => {
    if (!effectiveId || !event.storageId) return;
    navigation.navigate('Fridge', {
      householdId: effectiveId,
      storageId: event.storageId,
      storageName: event.storageName ?? route.params.storageName,
      storageEmoji: event.storageEmoji ?? route.params.storageEmoji,
    });
  }, [effectiveId, navigation, route.params.storageEmoji, route.params.storageName]);
  const { alertSections, alertCount } = useStockAlerts({
    items,
    allItems: allStockItems,
    activity: fridgeActivity,
    storageId: effectiveStorageId,
    storageName: route.params.storageName,
    lastSeenAt: stockActivitySeenAt,
    onOpenItem: openAlertItem,
    onOpenActivity: openAlertActivity,
  });

  React.useLayoutEffect(() => {
    (navigation as any).setOptions({
      headerAlert: () => (
        <HeaderIconButton icon="bell" badgeCount={alertCount} onPress={alertsSheet.open} />
      ),
      headerRight: () => (
        <HeaderActionGroup>
          <HeaderIconButton icon="help-circle" onPress={helpSheet.open} />
          <HeaderIconButton icon="menu" size={30} onPress={() => navigation.getParent()?.navigate('Menu' as never)} />
        </HeaderActionGroup>
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
    const statusBackground = exp?.status === 'expired'
      ? Colors.destructive + '14'
      : exp?.status === 'warning'
        ? '#F59E0B14'
        : exp?.status === 'ok'
          ? Colors.success + '14'
          : Colors.card;
    const statusBorder = exp?.status === 'expired'
      ? Colors.destructive + '40'
      : exp?.status === 'warning'
        ? '#F59E0B40'
        : exp?.status === 'ok'
          ? Colors.success + '40'
          : Colors.border;
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
    const highlightFrameStyle = isHighlighted
      ? {
        borderColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [statusBorder, Colors.accent],
        }),
      }
      : null;
    const highlightContentStyle = isHighlighted
      ? {
        backgroundColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [statusBackground, Colors.accent + '24'],
        }),
      }
      : null;

    return (
        <Animated.View style={[styles.itemRowFrame, { borderColor: statusBorder }, highlightFrameStyle]}>
          <AnimatedTouchableOpacity
            style={[styles.itemRow, { backgroundColor: statusBackground }, highlightContentStyle]}
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
        </Animated.View>
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
  storageChipText: { fontFamily: Typography.rounded, fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  storageChipTextActive: { color: '#fff' },

  storageAddChip: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  storageAddChipText: { fontFamily: Typography.rounded, fontSize: 18, color: Colors.textSecondary, lineHeight: 22 },
  list: { padding: 16, gap: 2, flexGrow: 1, paddingBottom: 24 },
  listHeader: { gap: 10, marginBottom: 10 },
  sectionLabel: { fontFamily: Typography.title, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
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
  categorizeButtonText: { fontFamily: Typography.title, fontSize: 14, fontWeight: '800', color: Colors.accent },
  categorizeBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  categorizeBadgeText: { fontFamily: Typography.title, color: '#fff', fontSize: 12, fontWeight: '800' },
  sectionGroupHeader: { fontFamily: Typography.title, fontSize: 13, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  itemRowFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  itemRow: {
    backgroundColor: Colors.card, borderRadius: 11, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  itemInfo: { flex: 1, minWidth: 0, gap: 2 },
  itemName: { fontFamily: Typography.rounded, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  itemRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 8 },
  finishedButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedButtonText: { fontFamily: Typography.title, fontSize: 13, color: Colors.textSecondary, fontWeight: '700', lineHeight: 18 },
  expBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  expBadgeText: { fontFamily: Typography.title, fontSize: 11, fontWeight: '700' },
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
  categoryChipText: { fontFamily: Typography.rounded, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  categoryChipTextActive: { color: '#fff' },
  itemMeta: { fontFamily: Typography.body, fontSize: 12, color: Colors.textSecondary },
  itemDate: { fontFamily: Typography.body, fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  itemMetaExpired: { color: Colors.destructive, fontWeight: '700' },
  itemMetaWarning: { color: '#F59E0B', fontWeight: '600' },
  itemMetaOk: { color: '#34C759', fontWeight: '500' },
  quantityBadge: {
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.separator,
  },
  quantityText: { fontFamily: Typography.title, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  emptyContainer: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: Typography.title, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
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
  sheetTitle: { fontFamily: Typography.display, fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  sheetSubtitle: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
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
  categorizeItemName: { fontFamily: Typography.title, flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  categorizeItemQty: { fontFamily: Typography.title, fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  categorizeEmpty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
});

