import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';
import { expirationLabel, scheduleExpirationNotifications } from '../../utils/expiration';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'Fridge'>;
};

export default function FridgeScreen({ navigation }: Props) {
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  const { data: storages } = useStorages(effectiveId);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const effectiveStorageId = selectedStorageId ?? storages?.[0]?.id ?? null;

  const { data: items, isLoading: loadingItems, refetch } = useFridge(effectiveId, effectiveStorageId);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }
  React.useEffect(() => {
    if (!households) return;
    const valid = households.find((h) => h.id === selectedHouseholdId);
    if (selectedHouseholdId && !valid) {
      setSelectedHouseholdId(null);
    } else if (!selectedHouseholdId && households[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  React.useEffect(() => {
    setSelectedStorageId(null);
    setSelectedCategory(null);
  }, [effectiveId]);

  React.useEffect(() => {
    if (items && items.length > 0) {
      scheduleExpirationNotifications(items);
    }
  }, [items]);

  const availableCategories = React.useMemo(() => {
    if (!items) return [];
    const cats = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Array.from(cats);
  }, [items]);

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    if (!selectedCategory) return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  function renderItem({ item }: { item: FridgeItem }) {
    const exp = item.expirationDate ? expirationLabel(item.expirationDate) : null;
    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => navigation.navigate('FridgeItemDetail', { item, householdId: effectiveId! })}
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
          </View>
          {exp && (
            <Text style={[styles.itemMeta, exp.urgent && styles.itemMetaUrgent]}>{exp.text}</Text>
          )}
          {!exp && item.addedBy && <Text style={styles.itemMeta}>por {item.addedBy.name}</Text>}
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
        <View style={styles.householdPicker}>
          {households.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={[styles.pickerItem, h.id === effectiveId && styles.pickerItemActive]}
              onPress={() => setSelectedHouseholdId(h.id)}
            >
              <Text style={[styles.pickerItemText, h.id === effectiveId && styles.pickerItemTextActive]}>
                {h.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {storages !== undefined && (
        <View style={styles.storagePicker}>
          {storages.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.storageChip, s.id === effectiveStorageId && styles.storageChipActive]}
              onPress={() => setSelectedStorageId(s.id)}
            >
              <Text style={styles.storageChipEmoji}>{s.emoji}</Text>
              <Text style={[styles.storageChipText, s.id === effectiveStorageId && styles.storageChipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.storageAddChip}
            onPress={() => navigation.navigate('CreateStorage', { householdId: effectiveId })}
          >
            <Text style={styles.storageAddChipText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {availableCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryPickerWrapper}
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
      )}

      {loadingItems ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {selectedStorage ? `${selectedStorage.emoji} ${selectedStorage.name}` : 'Geladeira'} · {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Vazio</Text>
              <Text style={styles.emptySubtitle}>Adicione itens tocando no botão abaixo</Text>
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
  householdPicker: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.background },
  pickerItemActive: { backgroundColor: Colors.accent },
  pickerItemText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  pickerItemTextActive: { color: '#fff' },
  storagePicker: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator,
    flexWrap: 'wrap',
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
  list: { padding: 16, gap: 2, flexGrow: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  itemRow: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.separator, marginBottom: 8,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  categoryBadge: {
    backgroundColor: Colors.accent + '22',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  categoryPickerWrapper: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    maxHeight: 48,
  },
  categoryPicker: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
  },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  categoryChipTextActive: { color: '#fff' },
  itemMeta: { fontSize: 12, color: Colors.textSecondary },
  itemMetaUrgent: { color: Colors.destructive, fontWeight: '600' },
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
