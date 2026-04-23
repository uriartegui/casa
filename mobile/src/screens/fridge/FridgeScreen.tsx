import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';
import { expirationLabel, scheduleExpirationNotifications } from '../../utils/expiration';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'Fridge'>;
};

export default function FridgeScreen({ navigation }: Props) {
  const HOUSEHOLD_DROPDOWN_WIDTH = 180;
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;
  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);

  const { data: storages } = useStorages(effectiveId);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const effectiveStorageId = selectedStorageId ?? storages?.[0]?.id ?? null;

  const { data: items, isLoading: loadingItems, refetch } = useFridge(effectiveId, effectiveStorageId);
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logFilter, setLogFilter] = useState<7 | 30 | null>(null);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  useEffect(() => {
    const householdName = households?.find((h) => h.id === effectiveId)?.name ?? 'Geladeira';
    navigation.setOptions({
      title: householdName,
      headerLeft: () => null,
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowLog(true)} style={{ paddingHorizontal: 16, alignSelf: 'center' }}>
          <Text style={{ fontSize: 15, color: Colors.accent, fontWeight: '500' }}>Atividades</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, households, effectiveId]);

  useEffect(() => {
    if (!households) return;
    const valid = households.find((h) => h.id === selectedHouseholdId);
    if (selectedHouseholdId && !valid) {
      setSelectedHouseholdId(null);
    } else if (!selectedHouseholdId && households[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  useEffect(() => {
    setSelectedStorageId(null);
    setSelectedCategory(null);
  }, [effectiveId]);

  useEffect(() => {
    if (items && items.length > 0) {
      scheduleExpirationNotifications(items);
    }
  }, [items]);

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

  function renderLogModal() {
    const cutoff = logFilter ? Date.now() - logFilter * 86400000 : null;
    const sorted = [...(items ?? [])]
      .filter((it) => !cutoff || new Date(it.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return (
      <Modal visible={showLog} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLog(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Atividade</Text>
            <TouchableOpacity onPress={() => setShowLog(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            {([null, 7, 30] as const).map((f) => (
              <TouchableOpacity
                key={String(f)}
                style={[styles.filterChip, logFilter === f && styles.filterChipActive]}
                onPress={() => setLogFilter(f)}
              >
                <Text style={[styles.filterChipText, logFilter === f && styles.filterChipTextActive]}>
                  {f === null ? 'Tudo' : f === 7 ? '7 dias' : '30 dias'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {sorted.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>Nenhuma atividade neste periodo.</Text>
            </View>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(it) => it.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item: it }) => (
                <View style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityName}>{it.createdBy?.name ?? 'Alguem'}</Text>
                      {it.fromShoppingListName
                        ? <>{' mandou da Lista '}<Text style={styles.activityListName}>{it.fromShoppingListName}</Text>{': '}</>
                        : ' adicionou '}
                      <Text style={styles.activityItem}>{it.name}</Text>
                    </Text>
                    <Text style={styles.activityTime}>
                      {new Date(it.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(it.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    );
  }

  function renderItem({ item }: { item: FridgeItem }) {
    const exp = item.expirationDate ? expirationLabel(item.expirationDate) : null;
    const expStyle = exp?.status === 'expired'
      ? styles.itemMetaExpired
      : exp?.status === 'warning'
        ? styles.itemMetaWarning
        : styles.itemMetaOk;
    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => navigation.navigate('FridgeItemDetail', { item, householdId: effectiveId! })}
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {exp && <Text style={[styles.itemMeta, expStyle]}>{exp.text}</Text>}
          {!exp && item.createdBy && <Text style={styles.itemMeta}>por {item.createdBy.name}</Text>}
        </View>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loadingHouseholds) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>Crie ou entre em uma casa primeiro</Text>
      </View>
    );
  }

  const selectedStorage = storages?.find((s) => s.id === effectiveStorageId);

  return (
    <View style={styles.container}>
      {households && households.length > 1 && (
        <Modal
          visible={showHouseholdPicker}
          transparent
          animationType="none"
          onRequestClose={() => setShowHouseholdPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowHouseholdPicker(false)}
          >
            <View
              style={[
                styles.householdDropdown,
                {
                  top: pickerAnchor.y,
                  left: Math.max(12, pickerAnchor.x - HOUSEHOLD_DROPDOWN_WIDTH / 2),
                },
              ]}
            >
              {households.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.householdOption, h.id === effectiveId && styles.householdOptionActive]}
                  onPress={() => {
                    setSelectedHouseholdId(h.id);
                    setShowHouseholdPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.householdOptionText,
                      h.id === effectiveId && styles.householdOptionTextActive,
                    ]}
                  >
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {storages !== undefined && (
        <View style={styles.storagePicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.storagePickerContent}>
            {storages.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.storageChip, s.id === effectiveStorageId && styles.storageChipActive]}
                onPress={() => setSelectedStorageId(s.id)}
              >
                <Text style={[styles.storageChipText, s.id === effectiveStorageId && styles.storageChipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.storageAddChip}
            onPress={() => navigation.navigate('CreateStorage', { householdId: effectiveId })}
          >
            <Text style={styles.storageAddChipText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
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
            <Text style={styles.sectionLabel}>
              {selectedStorage ? `${selectedStorage.emoji} ${selectedStorage.name}` : 'Geladeira'} · {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
            </Text>
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

      {renderLogModal()}
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
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  modalList: { paddingHorizontal: 20, paddingBottom: 32 },
  modalEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalEmptyText: { fontSize: 15, color: Colors.textSecondary },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  activityName: { fontWeight: '600' },
  activityListName: { fontWeight: '600', color: Colors.accent },
  activityItem: { fontStyle: 'italic' },
  activityTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
