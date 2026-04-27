import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, SectionList, TouchableOpacity, Modal,
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
import { ShoppingItemSkeleton } from '../../components/Skeleton';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingListDetail'>;
  route: RouteProp<ShoppingStackParamList, 'ShoppingListDetail'>;
};

export default function ShoppingListDetailScreen({ navigation, route }: Props) {
  const { householdId, listId, listName, listUrgent, listPlace, listCategory } = route.params;
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
  const [sendQueue, setSendQueue] = useState<ShoppingItem[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedToSend, setSelectedToSend] = useState<Set<string>>(new Set());
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused || sendQueue.length === 0) return;
    const next = sendQueue[0];
    setSendQueue((q) => q.slice(1));
    navigation.navigate('SendToFridge', {
      householdId,
      listId,
      itemId: next.id,
      prefillName: next.name,
      prefillQuantity: Number(next.quantity),
      prefillUnit: next.unit ?? null,
      listName,
    });
  }, [isFocused, sendQueue]);

  function handleSendAllToFridge() {
    setSelectedToSend(new Set(bought.map((i) => i.id)));
    setShowSendModal(true);
  }

  function confirmSendToFridge() {
    const toSend = bought.filter((i) => selectedToSend.has(i.id));
    setShowSendModal(false);
    setSendQueue(toSend);
  }

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  function handleToggle(item: ShoppingItem) {
    toggleItem.mutate({ itemId: item.id, checked: !item.checked });
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
    if (prev !== undefined && prev > 0 && items.length === 0 && !isLoading) {
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
        <TouchableOpacity onPress={handleDeleteList} style={{ paddingHorizontal: 16, alignSelf: 'center' }}>
          <Text style={styles.headerButtonText}>Excluir</Text>
        </TouchableOpacity>
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
          <View style={styles.progressTopRow}>
            <Text style={styles.progressFraction}>{bought.length}/{total}</Text>
            <Text style={styles.progressLabel}>
              {bought.length === total ? 'tudo comprado' : 'comprados'}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(bought.length / total) * 100}%` as any }]} />
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={{ backgroundColor: Colors.background }}>
          {Array.from({ length: 5 }).map((_, i) => <ShoppingItemSkeleton key={i} />)}
        </View>
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
              <View style={[styles.sectionDot, !section.isPending && { backgroundColor: Colors.success }]} />
              <Text style={[styles.sectionLabel, !section.isPending && styles.sectionLabelBought]}>
                {section.title}
              </Text>
              {!section.isPending && bought.length > 0 && (
                <TouchableOpacity onPress={handleClearChecked} style={styles.clearBtn}>
                  <Text style={styles.clearButton}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        />
      )}

      <Modal visible={showSendModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSendModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mandar para geladeira</Text>
            <TouchableOpacity onPress={() => setShowSendModal(false)}>
              <Text style={styles.modalClose}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Selecione os itens que deseja mandar:</Text>
          {bought.map((item) => {
            const selected = selectedToSend.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedToSend((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  });
                }}
              >
                <View style={[styles.modalCheckbox, selected && styles.modalCheckboxChecked]}>
                  {selected && <Text style={styles.modalCheckmark}>✓</Text>}
                </View>
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemQty}>{item.quantity} {item.unit ?? ''}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.button, { margin: 16, marginTop: 24 }]}
            disabled={selectedToSend.size === 0}
            onPress={confirmSendToFridge}
          >
            <Text style={styles.buttonText}>
              🧊 Mandar {selectedToSend.size} {selectedToSend.size === 1 ? 'item' : 'itens'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.footer}>
        {bought.length > 0 && (
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleSendAllToFridge}>
            <Text style={styles.buttonSecondaryText}>Mandar comprados para a geladeira</Text>
          </TouchableOpacity>
        )}
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
  metaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, flexWrap: 'wrap' },
  metaChip: { fontSize: 13, color: Colors.textSecondary },
  progressContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  progressTopRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  progressFraction: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressBar: { height: 4, backgroundColor: Colors.separator, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  list: { paddingBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.background,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  sectionLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionLabelBought: { color: Colors.success },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  clearButton: { fontSize: 12, color: Colors.destructive, fontWeight: '600' },
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
  footer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonSecondary: { borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: Colors.accent + '12' },
  buttonSecondaryText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  headerButton: { paddingHorizontal: 4 },
  headerButtonText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
  urgentChip: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#F0A500', backgroundColor: 'transparent',
  },
  urgentChipActive: { backgroundColor: '#F0A500' },
  urgentChipText: { fontSize: 13, fontWeight: '600', color: '#F0A500' },
  urgentChipTextActive: { color: '#fff' },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 16, color: Colors.accent, fontWeight: '500' },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator, gap: 12 },
  modalCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  modalCheckboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modalCheckmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalItemName: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  modalItemQty: { fontSize: 13, color: Colors.textSecondary },
});
