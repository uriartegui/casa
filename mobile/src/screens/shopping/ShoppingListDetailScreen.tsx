import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, SectionList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
  KeyboardAvoidingView, Keyboard, Platform, ScrollView, Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import {
  useListItems, useShoppingLists, useToggleListItem, useRemoveListItem, useAddListItem,
  useClearCheckedListItems, useDeleteShoppingList, useUpdateShoppingList,
} from '../../hooks/useShoppingLists';
import { useKeepAwake } from 'expo-keep-awake';
import { useHouseholdCategoryGroups } from '../../hooks/useCategories';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { filterItems, categoryFor } from '../../constants/commonItems';
import { Unit } from '../../types';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingItem } from '../../types';
import { ShoppingItemSkeleton } from '../../components/Skeleton';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingListDetail'>;
  route: RouteProp<ShoppingStackParamList, 'ShoppingListDetail'>;
};

// Mantém a tela acesa enquanto a lista está em foco (uso no mercado).
// Em componente próprio porque hooks não podem ser condicionais.
function KeepAwakeWhileFocused() {
  useKeepAwake();
  return null;
}

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

function compareNames(a: ShoppingItem, b: ShoppingItem) {
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
}

export default function ShoppingListDetailScreen({ navigation, route }: Props) {
  const { householdId, listId, listName, listUrgent, listPlace, listCategory } = route.params;
  const [currentName, setCurrentName] = useState(listName);
  const [currentPlace, setCurrentPlace] = useState(listPlace ?? '');
  const [currentCategory, setCurrentCategory] = useState(listCategory ?? '');
  const [urgent, setUrgent] = useState(listUrgent);
  const updateList = useUpdateShoppingList(householdId);
  const { data: shoppingLists = [] } = useShoppingLists(householdId);
  const { data: items, isLoading, refetch } = useListItems(householdId, listId);
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const toggleItem = useToggleListItem(householdId, listId);
  const removeItem = useRemoveListItem(householdId, listId);
  const clearChecked = useClearCheckedListItems(householdId, listId);
  const deleteList = useDeleteShoppingList(householdId);
  const prevItemCount = useRef<number | undefined>(undefined);
  const [sendQueue, setSendQueue] = useState<ShoppingItem[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const addItem = useAddListItem(householdId, listId);
  const [quickName, setQuickName] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addQty, setAddQty] = useState('1');
  const [addUnit, setAddUnit] = useState<Unit>('un');
  const [addStorageId, setAddStorageId] = useState<string | null>(null);
  const [addCategory, setAddCategory] = useState<string | null>(null);
  const [showAddStorageOptions, setShowAddStorageOptions] = useState(false);
  const [showAddCategoryOptions, setShowAddCategoryOptions] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(listName);
  const [editPlace, setEditPlace] = useState(listPlace ?? '');
  const [editCategory, setEditCategory] = useState(listCategory ?? '');
  const [editUrgent, setEditUrgent] = useState(listUrgent);
  const { data: categoryGroups } = useHouseholdCategoryGroups(householdId);
  const categoryOrder = categoryGroups.flatMap((group) => group.categories.map((category) => category.label));
  const availableCategories = categoryGroups.flatMap((group) => group.categories);

  const openMenu = useCallback(() => {
    navigation.getParent()?.navigate('Menu' as never);
  }, [navigation]);
  const quickSuggestions = quickName.trim() ? filterItems(quickName).slice(0, 4) : [];
  const [selectedToSend, setSelectedToSend] = useState<Set<string>>(new Set());
  const isFocused = useIsFocused();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerKeyboardOffset = Platform.OS === 'ios' ? keyboardHeight : 0;

  useEffect(() => {
    const updateKeyboardHeight = (event: { endCoordinates: { height: number } }) => {
      if (event.endCoordinates.height > 0) setKeyboardHeight(event.endCoordinates.height);
    };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, updateKeyboardHeight);
    const frameSubscription = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillChangeFrame', updateKeyboardHeight)
      : null;
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSubscription.remove();
      frameSubscription?.remove();
      hideSubscription.remove();
    };
  }, []);

  const activeList = shoppingLists.find((list) => list.id === listId);

  useEffect(() => {
    if (!activeList) return;

    setCurrentName(activeList.name);
    setCurrentPlace(activeList.place ?? '');
    setCurrentCategory(activeList.category ?? '');
    setUrgent(activeList.urgent);
    navigation.setOptions({ title: activeList.name });
  }, [activeList?.category, activeList?.name, activeList?.place, activeList?.urgent, navigation]);

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
      prefillCategory: next.category ?? null,
      listName: currentName,
    });
  }, [isFocused, sendQueue, currentName]);

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

  function openAddModal(name?: string) {
    const value = (name ?? quickName).trim();
    if (!value) return;
    if (name) setQuickName(name);
    setAddQty('1');
    setAddUnit('un');
    const suggested = categoryFor(value);
    const matchingCategory = availableCategories.find((category) => category.label === suggested);
    setAddStorageId(matchingCategory?.storageId ?? null);
    setAddCategory(matchingCategory?.label ?? null);
    setShowAddStorageOptions(false);
    setShowAddCategoryOptions(false);
    setAddModal(true);
  }

  function confirmAdd() {
    const name = quickName.trim();
    const qty = parseFloat(addQty.replace(',', '.'));
    if (!name) return;
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    addItem.mutate({ name, quantity: qty, unit: addUnit, category: addCategory ?? undefined });
    setQuickName('');
    setAddModal(false);
  }

  async function handleShareList() {
    const pendingLines = pending.map((item) => `☐ ${item.name}${item.quantity ? ` (${item.quantity} ${item.unit ?? 'un'})` : ''}`);
    const boughtLines = bought.map((item) => `✓ ${item.name}${item.quantity ? ` (${item.quantity} ${item.unit ?? 'un'})` : ''}`);
    const message = [
      `Lista: ${currentName}`,
      pendingLines.length > 0 ? '\nA comprar:\n' + pendingLines.join('\n') : '',
      boughtLines.length > 0 ? '\nComprados:\n' + boughtLines.join('\n') : '',
    ].filter(Boolean).join('\n');
    await Share.share({ message });
  }

  function openEditModal() {
    setEditName(currentName);
    setEditPlace(currentPlace);
    setEditCategory(currentCategory);
    setEditUrgent(urgent);
    setEditModal(true);
  }

  async function handleSaveListEdit() {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Erro', 'Digite o nome da lista.');
      return;
    }

    try {
      await updateList.mutateAsync({
        listId,
        name: trimmedName,
        place: editPlace.trim() || undefined,
        category: editCategory.trim() || undefined,
        urgent: editUrgent,
      });
      setCurrentName(trimmedName);
      setCurrentPlace(editPlace.trim());
      setCurrentCategory(editCategory.trim());
      setUrgent(editUrgent);
      navigation.setParams({
        listName: trimmedName,
        listPlace: editPlace.trim() || null,
        listCategory: editCategory.trim() || null,
        listUrgent: editUrgent,
      });
      setEditModal(false);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar a lista.');
    }
  }

  async function handleToggleUrgent() {
    const nextUrgent = !urgent;
    try {
      await updateList.mutateAsync({
        listId,
        name: currentName,
        place: currentPlace || undefined,
        category: currentCategory || undefined,
        urgent: nextUrgent,
      });
      setUrgent(nextUrgent);
      navigation.setParams({ listUrgent: nextUrgent });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar a lista.');
    }
  }

  function stepQty(delta: number) {
    const current = parseFloat(addQty.replace(',', '.'));
    const next = Math.max(1, (isNaN(current) ? 1 : current) + delta);
    setAddQty(String(next));
  }

  function handleClearChecked() {
    const count = bought.length;
    Alert.alert('Limpar comprados', `Remover ${count} ${count === 1 ? 'item comprado' : 'itens comprados'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearChecked.mutate() },
    ]);
  }

  const handleDelete = useCallback((itemId: string, itemName?: string) => {
    Alert.alert(itemName ? `Remover "${itemName}" da lista?` : 'Remover item da lista?', 'Voce esta excluindo este item da lista.', [
      { text: 'Remover', style: 'destructive', onPress: () => removeItem.mutate(itemId) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [removeItem]);

  const pending = items?.filter((i) => !i.checked) ?? [];
  const bought = items?.filter((i) => i.checked) ?? [];
  const total = items?.length ?? 0;
  const storeBoughtButtonLabel =
    bought.length === 1
      ? `Guardar ${bought[0].name}`
      : `Guardar ${bought.length} comprados`;
  const selectedAllBought = bought.length > 0 && selectedToSend.size === bought.length;
  const selectedAddStorage = categoryGroups.find((group) => group.storageId === addStorageId);

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
      title: currentName,
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openEditModal} style={styles.headerButton}>
            <Text style={styles.headerEditText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareList} style={styles.headerButton}>
            <Text style={styles.headerShareText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMenu} style={styles.headerMenuButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="menu" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [currentName, handleShareList, pending, bought, openMenu]);

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
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
        <TouchableOpacity
          style={styles.removeButton}
          onPress={(event) => {
            event.stopPropagation();
            handleDelete(item.id, item.name);
          }}
          activeOpacity={0.7}
          accessibilityLabel={`Remover ${item.name}`}
        >
          <Text style={styles.removeButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // A comprar: uma seção por categoria (ordem dos corredores), itens em
  // ordem alfabética. Se ninguém categorizou nada, mantém a seção única.
  const pendingByCategory = new Map<string, ShoppingItem[]>();
  for (const item of pending) {
    const cat = item.category || 'Outros';
    const group = pendingByCategory.get(cat);
    if (group) group.push(item);
    else pendingByCategory.set(cat, [item]);
  }
  const onlyUncategorized = pendingByCategory.size === 1 && pendingByCategory.has('Outros');
  const pendingSections = onlyUncategorized
    ? [{ title: `A COMPRAR (${pending.length})`, data: [...pending].sort(compareNames), isPending: true }]
    : [...pendingByCategory.entries()]
        .sort((a, b) => {
          const rankA = categoryOrder.indexOf(a[0]);
          const rankB = categoryOrder.indexOf(b[0]);
          return (rankA === -1 ? categoryOrder.length : rankA) - (rankB === -1 ? categoryOrder.length : rankB)
            || a[0].localeCompare(b[0], 'pt-BR');
        })
        .map(([cat, data]) => ({ title: `${cat} (${data.length})`, data: data.sort(compareNames), isPending: true }));

  const sections = [
    ...(pending.length > 0 ? pendingSections : []),
    ...(bought.length > 0 ? [{ title: `COMPRADOS (${bought.length})`, data: [...bought].sort(compareNames), isPending: false }] : []),
  ];

  return (
    <View style={styles.container}>
      {isFocused && <KeepAwakeWhileFocused />}
      <View style={[styles.contentArea, { paddingBottom: footerHeight + footerKeyboardOffset }]}>
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

      <View style={styles.metaRow}>
        <TouchableOpacity
          style={[styles.urgentChip, urgent && styles.urgentChipActive]}
          onPress={handleToggleUrgent}
          activeOpacity={0.75}
        >
          <Text style={[styles.urgentChipText, urgent && styles.urgentChipTextActive]}>
            {urgent ? 'Urgente' : 'Marcar urgente'}
          </Text>
        </TouchableOpacity>
        {!!currentPlace && <Text style={styles.metaChip}>{currentPlace}</Text>}
        {!!currentCategory && <Text style={styles.metaChip}>{currentCategory}</Text>}
      </View>

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
      </View>

      <Modal visible={showSendModal} transparent animationType="slide" onRequestClose={() => setShowSendModal(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowSendModal(false)} />
          <View style={styles.sendSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Guardar no estoque</Text>
          <View style={styles.modalSummary}>
            <Text style={styles.modalSummaryTitle}>
              {bought.length} {bought.length === 1 ? 'item comprado pronto' : 'itens comprados prontos'}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedToSend(selectedAllBought ? new Set() : new Set(bought.map((item) => item.id)))}
            >
              <Text style={styles.modalToggleAll}>
                {selectedAllBought ? 'Desmarcar todos' : 'Selecionar todos'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Escolha o que voce quer guardar agora.</Text>
          <ScrollView style={styles.sendItemsScroll} contentContainerStyle={styles.sendItemsContent} showsVerticalScrollIndicator={false}>
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
                    {selected && <Text style={styles.modalCheckmark}>{'\u2713'}</Text>}
                  </View>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemQty}>{item.quantity} {item.unit ?? ''}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, styles.sendButton, selectedToSend.size === 0 && styles.buttonDisabled]}
            disabled={selectedToSend.size === 0}
            onPress={confirmSendToFridge}
          >
            <Text style={styles.buttonText}>
              Guardar {selectedToSend.size} {selectedToSend.size === 1 ? 'item' : 'itens'}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setEditModal(false)} />
          <KeyboardAvoidingView style={styles.sheetKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Editar lista</Text>

              <Text style={styles.sheetLabel}>Nome da lista</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ex: Mercado da semana"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
              />

              <Text style={styles.sheetLabel}>Lugar de compra</Text>
              <TextInput
                style={styles.editInput}
                value={editPlace}
                onChangeText={setEditPlace}
                placeholder="Ex: Mercado, farmacia"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
              />

              <Text style={styles.sheetLabel}>Categoria</Text>
              <TextInput
                style={styles.editInput}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="Ex: Semana, limpeza"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSaveListEdit}
              />

              <TouchableOpacity style={styles.editCheckRow} onPress={() => setEditUrgent((value) => !value)} activeOpacity={0.75}>
                <View style={[styles.editCheckbox, editUrgent && styles.editCheckboxChecked]}>
                  {editUrgent && <Text style={styles.editCheckboxMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editCheckTitle}>Lista urgente</Text>
                  <Text style={styles.editCheckSubtitle}>Use para destacar essa lista na Home.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSaveListEdit} disabled={updateList.isPending}>
                {updateList.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Salvar alterações</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View
        style={[styles.footer, styles.footerFloating, { bottom: footerKeyboardOffset }]}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      >
          {quickSuggestions.length > 0 && (
            <View style={styles.suggestionsRow}>
              {quickSuggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => openAddModal(s)}>
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.quickAddRow}>
            <TextInput
              style={styles.quickAddInput}
              placeholder="Adicionar item..."
              placeholderTextColor={Colors.textSecondary}
              value={quickName}
              onChangeText={setQuickName}
              onSubmitEditing={() => openAddModal()}
              returnKeyType="done"
              blurOnSubmit={false}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.quickAddBtn, !quickName.trim() && { opacity: 0.4 }]}
              onPress={() => openAddModal()}
              disabled={!quickName.trim()}
            >
              <Text style={styles.quickAddBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {bought.length > 0 && (
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleSendAllToFridge}>
              <Text style={styles.buttonSecondaryText}>{storeBoughtButtonLabel}</Text>
            </TouchableOpacity>
          )}
      </View>

      {/* Bottom sheet: quantidade e unidade do item novo */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setAddModal(false)} />
          <KeyboardAvoidingView style={styles.addSheetKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.sheetStatic, styles.addSheet]}>
              <View style={styles.sheetHandle} />
              <ScrollView contentContainerStyle={styles.addSheetContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{quickName.trim()}</Text>

              <Text style={styles.sheetLabel}>Quantidade</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => stepQty(-1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={addQty}
                  onChangeText={setAddQty}
                  keyboardType="decimal-pad"
                  textAlign="center"
                  selectTextOnFocus
                />
                <TouchableOpacity style={styles.qtyBtn} onPress={() => stepQty(1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetLabel}>Unidade</Text>
              <View style={styles.unitRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, addUnit === u && styles.unitChipActive]}
                    onPress={() => setAddUnit(u)}
                  >
                    <Text style={[styles.unitChipText, addUnit === u && styles.unitChipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sheetLabel}>Estoque</Text>
              <View style={[styles.selectField, showAddStorageOptions && styles.selectFieldOpen]}>
              <TouchableOpacity
                style={styles.selectRow}
                onPress={() => {
                  setShowAddStorageOptions((value) => !value);
                  setShowAddCategoryOptions(false);
                }}
              >
                <Text style={[styles.selectRowText, !addStorageId && styles.selectRowPlaceholder]}>
                  {selectedAddStorage
                    ? `${selectedAddStorage.storageEmoji} ${selectedAddStorage.storageName}`
                    : 'Escolher estoque'}
                </Text>
                <Feather name={showAddStorageOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                <Text style={styles.selectRowChevron}>›</Text>
              </TouchableOpacity>

              {showAddStorageOptions && (
                  <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
                  {categoryGroups.map((group) => (
                    <TouchableOpacity
                      key={group.storageId}
                      style={[styles.selectOption, addStorageId === group.storageId && styles.selectOptionActive]}
                      onPress={() => {
                        setAddStorageId(group.storageId);
                        setAddCategory(null);
                        setShowAddStorageOptions(false);
                        setShowAddCategoryOptions(false);
                      }}
                    >
                      <Text style={[styles.selectOptionText, addStorageId === group.storageId && styles.selectOptionTextActive]}>{group.storageName}</Text>
                      {addStorageId === group.storageId && <Feather name="check" size={16} color={Colors.accent} />}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
              )}
              </View>

              <Text style={styles.sheetLabel}>Categoria <Text style={styles.optional}>(opcional)</Text></Text>
              <View style={[styles.selectField, showAddCategoryOptions && styles.selectFieldOpen]}>
              <TouchableOpacity
                style={[styles.selectRow, !addStorageId && styles.selectRowDisabled]}
                onPress={() => {
                  if (!addStorageId) return;
                  setShowAddCategoryOptions((value) => !value);
                  setShowAddStorageOptions(false);
                }}
              >
                <Text style={[styles.selectRowText, !addCategory && styles.selectRowPlaceholder]}>
                  {addCategory ?? (addStorageId ? 'Escolher categoria' : 'Escolha um estoque primeiro')}
                </Text>
                <Feather name={showAddCategoryOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
                <Text style={styles.selectRowChevron}>›</Text>
              </TouchableOpacity>

              {showAddCategoryOptions && addStorageId && (
                  <ScrollView style={[styles.selectOptions, styles.selectOptionsAbove]} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
                  <TouchableOpacity
                    style={[styles.selectOption, !addCategory && styles.selectOptionActive]}
                    onPress={() => {
                      setAddCategory(null);
                      setShowAddCategoryOptions(false);
                    }}
                  >
                    <Text style={[styles.selectOptionText, !addCategory && styles.selectOptionTextActive]}>Sem categoria</Text>
                    {!addCategory && <Feather name="check" size={16} color={Colors.accent} />}
                  </TouchableOpacity>
                  {(selectedAddStorage?.categories ?? []).map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.selectOption, addCategory === category.label && styles.selectOptionActive]}
                      onPress={() => {
                        setAddCategory(category.label);
                        setShowAddCategoryOptions(false);
                      }}
                    >
                      <Text style={[styles.selectOptionText, addCategory === category.label && styles.selectOptionTextActive]}>{category.label}</Text>
                      {addCategory === category.label && <Feather name="check" size={16} color={Colors.accent} />}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
              )}
              </View>

              <TouchableOpacity style={styles.button} onPress={confirmAdd} disabled={addItem.isPending}>
                {addItem.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Adicionar à lista</Text>
                }
              </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, flexWrap: 'wrap' },
  metaChip: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
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
  itemQty: { fontSize: 13, color: Colors.textSecondary, flexShrink: 0 },
  itemQtyChecked: { color: Colors.border },
  removeButton: {
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeButtonText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  footer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  footerFloating: { position: 'absolute', left: 0, right: 0, zIndex: 10 },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20, textAlign: 'center' },
  buttonSecondary: { borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: Colors.accent + '12' },
  buttonSecondaryText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  suggestionChip: {
    backgroundColor: Colors.accent + '14', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  suggestionChipText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  quickAddRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  quickAddInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  quickAddBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  quickAddBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28 },

  // Bottom sheet de quantidade/unidade
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '94%',
  },
  sheetStatic: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28,
    gap: 8,
  },
  sheetKeyboard: { justifyContent: 'flex-end', maxHeight: '100%' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 8 },
  addSheetKeyboard: { justifyContent: 'flex-end' },
  addSheet: { minHeight: '84%', maxHeight: '94%' },
  addSheetContent: { gap: 8, paddingBottom: 8 },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.separator,
    alignSelf: 'center', marginBottom: 8,
  },
  sheetTitle: { fontSize: 21, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sheetLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8,
  },
  editInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  editCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    marginTop: 8,
  },
  editCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCheckboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  editCheckboxMark: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  editCheckTitle: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  editCheckSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  optional: { fontSize: 11, color: Colors.textSecondary, fontWeight: '400', textTransform: 'none' },
  selectRow: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectRowDisabled: { opacity: 0.65 },
  selectRowText: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  selectRowPlaceholder: { color: Colors.textSecondary, fontWeight: '500' },
  selectField: { position: 'relative' },
  selectFieldOpen: { zIndex: 30, elevation: 30 },
  selectOptions: { position: 'absolute', top: 52, left: 0, right: 0, zIndex: 40, elevation: 40, maxHeight: 260, overflow: 'hidden', borderWidth: 1, borderColor: Colors.separator, borderRadius: 12, backgroundColor: Colors.card, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  selectOptionsAbove: { top: undefined, bottom: 52 },
  selectOptionsContent: { paddingBottom: 1 },
  selectOption: { minHeight: 42, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  selectOptionActive: { backgroundColor: Colors.accent + '12' },
  selectOptionText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  selectOptionTextActive: { color: Colors.accent, fontWeight: '800' },
  selectRowToggle: { fontSize: 18, color: Colors.accent, fontWeight: '800', lineHeight: 22 },
  selectRowChevron: { width: 0, height: 0, opacity: 0 },
  compactOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -2 },
  compactChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  compactChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  compactChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  compactChipTextActive: { color: '#fff' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, lineHeight: 28 },
  qtyInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    paddingVertical: 12, fontSize: 22, fontWeight: '700',
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator,
  },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitChipText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  unitChipTextActive: { color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButton: { paddingHorizontal: 4 },
  headerMenuButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerEditText: { color: Colors.accent, fontSize: 14, fontWeight: '500' },
  headerShareText: { color: Colors.accent, fontSize: 14, fontWeight: '500' },
  headerButtonText: { color: Colors.destructive, fontSize: 15, fontWeight: '500' },
  urgentChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#F0A500', backgroundColor: 'transparent',
  },
  urgentChipActive: { backgroundColor: '#F0A500' },
  urgentChipText: { fontSize: 13, fontWeight: '600', color: '#F0A500' },
  urgentChipTextActive: { color: '#fff' },
  sendSheet: { maxHeight: '84%', backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  sendItemsScroll: { maxHeight: 300, marginTop: 4 },
  sendItemsContent: { paddingBottom: 4 },
  modalSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  modalSummaryTitle: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },
  modalToggleAll: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator, gap: 12 },
  modalCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  modalCheckboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modalCheckmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalItemName: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  modalItemQty: { fontSize: 13, color: Colors.textSecondary },
  sendButton: { marginTop: 14 },
  buttonDisabled: { opacity: 0.45 },
});
