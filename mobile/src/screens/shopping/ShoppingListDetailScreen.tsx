import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  useListItems, useToggleListItem, useRemoveListItem,
  useClearCheckedListItems, useDeleteShoppingList, useUpdateShoppingList,
} from '../../hooks/useShoppingLists';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingItem } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingListDetail'>;
  route: RouteProp<ShoppingStackParamList, 'ShoppingListDetail'>;
};

export default function ShoppingListDetailScreen({ navigation, route }: Props) {
  const { householdId, listId, listName, listUrgent } = route.params;
  const [urgent, setUrgent] = useState(listUrgent);
  const updateList = useUpdateShoppingList(householdId);
  const { data: items, isLoading, refetch } = useListItems(householdId, listId);
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const toggleItem = useToggleListItem(householdId, listId);
  const removeItem = useRemoveListItem(householdId, listId);
  const clearChecked = useClearCheckedListItems(householdId, listId);
  const deleteList = useDeleteShoppingList(householdId);
  const addFridgeItem = useAddFridgeItem(householdId);
  const prevItemCount = useRef<number | undefined>(undefined);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

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
            onPress: () => navigation.navigate('SendToFridge', {
              householdId,
              listId,
              itemId: item.id,
              prefillName: item.name,
              prefillQuantity: Number(item.quantity),
              prefillUnit: item.unit ?? null,
              listName,
            }),
          },
        ],
      );
    }
  }

  function handleClearChecked() {
    const count = bought.length;
    Alert.alert('Limpar comprados', `Remover ${count} ${count === 1 ? 'item comprado' : 'itens comprados'}?`, [
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

  const pending = items?.filter((i) => !i.checked) ?? [];
  const bought = items?.filter((i) => i.checked) ?? [];
  const total = items?.length ?? 0;

  const handleDeleteList = useCallback(() => {
    const doDelete = () => deleteList.mutate(listId, { onSuccess: () => navigation.goBack() });

    if (pending.length > 0) {
      Alert.alert(
        'Excluir lista',
        `Há ${pending.length} ${pending.length === 1 ? 'item não comprado' : 'itens não comprados'}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Mandar tudo para geladeira',
            onPress: () => {
              Promise.all(
                pending.map((item) =>
                  addFridgeItem.mutateAsync({
                    name: item.name,
                    quantity: Number(item.quantity),
                    unit: item.unit ?? undefined,
                    fromShoppingListName: listName,
                  }),
                ),
              ).then(doDelete);
            },
          },
          { text: 'Excluir lista', style: 'destructive', onPress: doDelete },
        ],
      );
    } else {
      Alert.alert('Excluir lista', 'Deseja excluir esta lista?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [pending, deleteList, addFridgeItem, listId, navigation]);

  // Detect transition to empty list
  useEffect(() => {
    if (items === undefined) return;
    const prev = prevItemCount.current;
    prevItemCount.current = items.length;
    if (prev !== undefined && prev > 0 && items.length === 0) {
      Alert.alert('Lista vazia', 'Todos os itens foram removidos. Deseja excluir esta lista?', [
        { text: 'Manter', style: 'cancel' },
        {
          text: 'Excluir lista',
          style: 'destructive',
          onPress: () => deleteList.mutate(listId, { onSuccess: () => navigation.goBack() }),
        },
      ]);
    }
  }, [items]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => {
            const next = !urgent;
            setUrgent(next);
            updateList.mutate({ listId, name: listName, urgent: next });
          }}>
            <Text style={[styles.headerButtonText, urgent ? styles.headerButtonUrgentActive : styles.headerButtonUrgent]}>
              {urgent ? '🚨 Urgente' : 'Urgente'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteList}>
            <Text style={styles.headerButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [handleDeleteList]);

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

  const sections = [
    ...(pending.length > 0 ? [{ title: `A COMPRAR (${pending.length})`, data: pending, isPending: true }] : []),
    ...(bought.length > 0 ? [{ title: `COMPRADOS (${bought.length})`, data: bought, isPending: false }] : []),
  ];

  return (
    <View style={styles.container}>
      {total > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>{bought.length} de {total} comprados</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(bought.length / total) * 100}%` as any }]} />
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Lista vazia</Text>
          <Text style={styles.emptySubtitle}>Adicione itens para começar</Text>
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
              {!section.isPending && bought.length > 0 && (
                <TouchableOpacity onPress={handleClearChecked}>
                  <Text style={styles.clearButton}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddShoppingItem', { householdId, listId })}
        >
          <Text style={styles.buttonText}>+ Adicionar item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerButton: { paddingHorizontal: 4 },
  headerButtonText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
  headerButtonUrgent: { color: '#F0A500' },
  headerButtonUrgentActive: { color: '#B45309', fontWeight: '700' },
});
