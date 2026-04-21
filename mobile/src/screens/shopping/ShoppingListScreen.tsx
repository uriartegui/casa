import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, SectionList,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useAddFridgeItem } from '../../hooks/useFridge';
import {
  useShoppingList,
  useToggleShoppingItem,
  useRemoveShoppingItem,
  useClearCheckedItems,
} from '../../hooks/useShoppingList';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingItem } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingList'>;
};

export default function ShoppingListScreen({ navigation }: Props) {
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  const { data: items, isLoading, refetch, isRefetching } = useShoppingList(effectiveId);
  const toggleItem = useToggleShoppingItem(effectiveId ?? '');
  const removeItem = useRemoveShoppingItem(effectiveId ?? '');
  const clearChecked = useClearCheckedItems(effectiveId ?? '');
  const addToFridge = useAddFridgeItem(effectiveId ?? '');

  React.useEffect(() => {
    if (!selectedHouseholdId && households?.[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  const pending = items?.filter((i) => !i.checked) ?? [];
  const bought = items?.filter((i) => i.checked) ?? [];
  const total = items?.length ?? 0;
  const boughtCount = bought.length;

  function handleToggle(item: ShoppingItem) {
    const newChecked = !item.checked;
    toggleItem.mutate({ itemId: item.id, checked: newChecked });

    if (newChecked) {
      Alert.alert(
        `✓ ${item.name} comprado!`,
        'Adicionar na geladeira?',
        [
          { text: 'Não', style: 'cancel' },
          {
            text: 'Sim',
            onPress: () => addToFridge.mutate({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit ?? 'un',
            }),
          },
        ],
      );
    }
  }

  function handleClearChecked() {
    Alert.alert('Limpar comprados', `Remover ${boughtCount} ${boughtCount === 1 ? 'item comprado' : 'itens comprados'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearChecked.mutate() },
    ]);
  }

  const handleDelete = useCallback((itemId: string) => {
    Alert.alert('Remover item', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeItem.mutate(itemId) },
    ]);
  }, [removeItem]);

  const renderRightActions = useCallback((itemId: string) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(itemId)}>
      <Text style={styles.deleteActionText}>Remover</Text>
    </TouchableOpacity>
  ), [handleDelete]);

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
        <TouchableOpacity style={styles.itemRow} onPress={() => handleToggle(item)} activeOpacity={0.7}>
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
          </View>
          <Text style={[styles.itemQty, item.checked && styles.itemQtyChecked]}>
            {item.quantity} {item.unit ?? ''}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  if (loadingHouseholds) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>Crie ou entre em uma casa primeiro</Text>
      </View>
    );
  }

  const sections = [
    ...(pending.length > 0 ? [{ title: `A COMPRAR (${pending.length})`, data: pending, isPending: true }] : []),
    ...(bought.length > 0 ? [{ title: `COMPRADOS (${boughtCount})`, data: bought, isPending: false }] : []),
  ];

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

      {total > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>{boughtCount} de {total} comprados</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${total > 0 ? (boughtCount / total) * 100 : 0}%` as any }]} />
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Lista vazia</Text>
          <Text style={styles.emptySubtitle}>Adicione itens ou remova itens da geladeira</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, !section.isPending && styles.sectionLabelBought]}>
                {section.title}
              </Text>
              {!section.isPending && boughtCount > 0 && (
                <TouchableOpacity onPress={handleClearChecked}>
                  <Text style={styles.clearButton}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddShoppingItem', { householdId: effectiveId })}
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
  progressContainer: { padding: 16, paddingBottom: 8, gap: 6 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: Colors.success },
  progressBar: { height: 6, backgroundColor: Colors.separator, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 3 },
  list: { paddingBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: Colors.background,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  sectionLabelBought: { color: Colors.success },
  clearButton: { fontSize: 13, color: Colors.destructive, fontWeight: '500' },
  itemRow: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 2,
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.separator,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  itemNameChecked: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  itemQty: { fontSize: 13, color: Colors.textSecondary },
  itemQtyChecked: { color: Colors.border },
  deleteAction: {
    backgroundColor: Colors.destructive, justifyContent: 'center', alignItems: 'center',
    width: 80, borderRadius: 10, marginHorizontal: 4, marginBottom: 2,
  },
  deleteActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
