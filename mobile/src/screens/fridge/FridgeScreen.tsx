import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFridge, useRemoveFridgeItem } from '../../hooks/useFridge';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';
import { expirationLabel } from '../../utils/expiration';
import { formatBrDate } from '../../utils/dateUtils';
import { FridgeItemSkeleton } from '../../components/Skeleton';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'Fridge'>;
  route: RouteProp<FridgeStackParamList, 'Fridge'>;
};

export default function FridgeScreen({ navigation, route }: Props) {
  const {
    householdId: effectiveId,
    storageId: effectiveStorageId,
    storageName,
    storageEmoji,
  } = route.params;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: items, isLoading: loadingItems, refetch } = useFridge(effectiveId, effectiveStorageId);
  const removeItem = useRemoveFridgeItem(effectiveId ?? '');
  const { data: shoppingLists } = useShoppingLists(effectiveId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

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

  async function doRemove(item: FridgeItem, toShoppingListName?: string) {
    try {
      await removeItem.mutateAsync({ itemId: item.id, toShoppingListName });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel remover o item.');
    }
  }

  function handlePickListAndRemove(item: FridgeItem) {
    const lists = shoppingLists ?? [];
    if (lists.length === 0) {
      Alert.alert('Sem listas', 'Crie uma lista de compras primeiro.');
      return;
    }
    Alert.alert(
      'Escolher lista',
      'Adicionar a qual lista?',
      [
        ...lists.map((l) => ({
          text: l.name,
          onPress: async () => {
            await doRemove(item, l.name);
            try {
              await api.post(`/households/${effectiveId}/shopping-lists/${l.id}/items`, {
                name: item.name,
                quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
                unit: item.unit ?? 'un',
                category: item.category ?? undefined,
              });
              queryClient.invalidateQueries({ queryKey: ['shopping-list-items', effectiveId, l.id] });
              queryClient.invalidateQueries({ queryKey: ['shopping-lists', effectiveId] });
            } catch {
              showToast('Item removido, mas erro ao adicionar a lista', 'error');
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  function confirmItemFinished(item: FridgeItem) {
    Alert.alert(`"${item.name}" acabou?`, 'Voce esta excluindo este item do estoque.', [
      { text: 'Somente excluir', style: 'destructive', onPress: () => doRemove(item) },
      { text: 'Excluir e mandar para lista', onPress: () => handlePickListAndRemove(item) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
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

    return (
        <TouchableOpacity
          style={[styles.itemRow, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}
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
        </TouchableOpacity>
    );
  }

  const selectedStorage = { id: effectiveStorageId, name: storageName, emoji: storageEmoji };

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
            <Text style={styles.sectionLabel}>{summaryText}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 8 },
  headerHouseholdTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 180,
  },
  headerHouseholdTriggerText: { fontSize: 17, color: Colors.textPrimary, fontWeight: '700' },
  modalBackdrop: { flex: 1 },
  householdDropdown: {
    position: 'absolute',
    width: 180,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  householdOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  householdOptionActive: { backgroundColor: Colors.accent + '18' },
  householdOptionText: { fontSize: 14, color: Colors.textPrimary },
  householdOptionTextActive: { color: Colors.accent, fontWeight: '600' },
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
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
