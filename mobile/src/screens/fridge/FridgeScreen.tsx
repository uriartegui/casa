import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge, useRemoveFridgeItem } from '../../hooks/useFridge';
import { useAddShoppingItem } from '../../hooks/useShoppingList';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeItem } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'Fridge'>;
};

export default function FridgeScreen({ navigation }: Props) {
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;
  const { data: items, isLoading: loadingItems, refetch, isRefetching } = useFridge(effectiveId);
  const removeItem = useRemoveFridgeItem(effectiveId ?? '');
  const addToList = useAddShoppingItem(effectiveId ?? '');

  React.useEffect(() => {
    if (!selectedHouseholdId && households?.[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  const handleDelete = useCallback((item: FridgeItem) => {
    Alert.alert(
      `Remover "${item.name}"`,
      'O que deseja fazer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '🛒 Remover + adicionar à lista',
          onPress: () => {
            removeItem.mutate(item.id);
            addToList.mutate({ name: item.name, quantity: item.quantity, unit: item.unit });
          },
        },
        {
          text: 'Só remover',
          style: 'destructive',
          onPress: () => removeItem.mutate(item.id),
        },
      ],
    );
  }, [removeItem, addToList]);

  const renderRightActions = useCallback((item: FridgeItem) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(item)}>
      <Text style={styles.deleteActionText}>Remover</Text>
    </TouchableOpacity>
  ), [handleDelete]);

  function renderItem({ item }: { item: FridgeItem }) {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.addedBy && <Text style={styles.itemMeta}>por {item.addedBy.name}</Text>}
          </View>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
          </View>
        </View>
      </Swipeable>
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

  const selectedHousehold = households?.find((h) => h.id === effectiveId);

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

      {loadingItems ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {selectedHousehold?.name ?? 'Geladeira'} · {items?.length ?? 0} {items?.length === 1 ? 'item' : 'itens'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Geladeira vazia</Text>
              <Text style={styles.emptySubtitle}>Adicione itens tocando no botão abaixo</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddFridgeItem', { householdId: effectiveId })}
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
  list: { padding: 16, gap: 2, flexGrow: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  itemRow: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.separator, marginBottom: 8,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  itemMeta: { fontSize: 12, color: Colors.textSecondary },
  quantityBadge: {
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.separator,
  },
  quantityText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  deleteAction: {
    backgroundColor: Colors.destructive, justifyContent: 'center', alignItems: 'center',
    width: 80, borderRadius: 10, marginBottom: 8,
  },
  deleteActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
