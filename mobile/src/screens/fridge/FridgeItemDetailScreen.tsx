import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DatePickerModal from '../../components/DatePickerModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useUpdateFridgeItem, useRemoveFridgeItem, useFridgeItem } from '../../hooks/useFridge';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';
import { showFinishedFridgeItemAlert } from '../../utils/fridgeFinishedFlow';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'FridgeItemDetail'>;
  route: RouteProp<FridgeStackParamList, 'FridgeItemDetail'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

type DirtyFields = {
  name: boolean;
  quantity: boolean;
  unit: boolean;
  expirationDate: boolean;
  category: boolean;
};

const cleanDirtyFields: DirtyFields = {
  name: false,
  quantity: false,
  unit: false,
  expirationDate: false,
  category: false,
};

export default function FridgeItemDetailScreen({ navigation, route }: Props) {
  const { itemId, householdId } = route.params;
  const { data: item, isLoading, isError, refetch } = useFridgeItem(householdId, itemId);
  const [dirtyFields, setDirtyFields] = useState<DirtyFields>(cleanDirtyFields);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>('un');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [expirationPickerVisible, setExpirationPickerVisible] = useState(false);
  const { data: categories } = useCategories(householdId, item?.storageId ?? item?.storage?.id ?? null);
  const updateItem = useUpdateFridgeItem(householdId);
  const removeItem = useRemoveFridgeItem(householdId);
  const { data: shoppingLists, isLoading: loadingShoppingLists } = useShoppingLists(householdId);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!item) return;
    setName((current) => (dirtyFields.name ? current : item.name));
    setQuantity((current) => (dirtyFields.quantity ? current : String(item.quantity)));
    setUnit((current) => (dirtyFields.unit ? current : ((item.unit as Unit) ?? 'un')));
    setExpirationDate((current) => (
      dirtyFields.expirationDate
        ? current
        : item.expirationDate
          ? new Date(item.expirationDate + 'T00:00:00')
          : null
    ));
    setCategory((current) => (dirtyFields.category ? current : item.category ?? null));
  }, [item, dirtyFields]);

  function markEditing(field: keyof DirtyFields) {
    setDirtyFields((current) => ({ ...current, [field]: true }));
  }

  async function handleSave() {
    if (!item) {
      Alert.alert('Erro', 'Item ainda nao carregado.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    try {
      const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : null;
      const payload: {
        itemId: string;
        name?: string;
        quantity?: number;
        unit?: string;
        expirationDate?: string | null;
        category?: string | null;
      } = { itemId: item.id };

      if (name.trim() !== item.name) payload.name = name.trim();
      if (qty !== Number(item.quantity)) payload.quantity = qty;
      if (unit !== item.unit) payload.unit = unit;
      if (expStr !== (item.expirationDate ?? null)) payload.expirationDate = expStr;
      if ((category ?? null) !== (item.category ?? null)) payload.category = category;

      if (Object.keys(payload).length === 1) {
        navigation.goBack();
        return;
      }

      await updateItem.mutateAsync(payload);
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  }

  async function doRemoveAndAdd(listId: string, listName: string) {
    if (!item) return;

    try {
      await removeItem.mutateAsync({ itemId: item.id, toShoppingListName: listName });
    } catch {
      Alert.alert('Erro', 'Não foi possível remover o item.');
      return;
    }
    try {
      await api.post(`/households/${householdId}/shopping-lists/${listId}/items`, {
        name: item.name,
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        unit: item.unit ?? 'un',
        category: item.category ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    } catch {
      showToast('Item removido, mas erro ao adicionar à lista', 'error');
    }
    navigation.goBack();
  }

  function handlePickList() {
    const lists = shoppingLists ?? [];
    if (lists.length === 0) {
      Alert.alert('Sem listas', 'Crie uma lista de compras primeiro.');
      return;
    }
    Alert.alert(
      'Escolher lista',
      'Adicionar à qual lista?',
      [
        ...lists.map((l) => ({ text: l.name, onPress: () => doRemoveAndAdd(l.id, l.name) })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  function handleRemove() {
    if (!item) return;

    showFinishedFridgeItemAlert({
      householdId,
      item,
      shoppingLists,
      shoppingListsLoading: loadingShoppingLists,
      removeItem: removeItem.mutateAsync,
      queryClient,
      showToast,
      onDone: () => navigation.goBack(),
    });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Item nao encontrado</Text>
        <Text style={styles.emptySubtitle}>Ele pode ter sido removido por outro membro da casa.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do item</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => { markEditing('name'); setName(value); }}
          returnKeyType="next"
          placeholderTextColor={Colors.textSecondary}
          autoCorrect={false}
          spellCheck={false}
        />

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={(value) => { markEditing('quantity'); setQuantity(value); }}
          keyboardType="decimal-pad"
          returnKeyType="done"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Unidade</Text>
        <View style={styles.unitRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitChip, unit === u && styles.unitChipActive]}
              onPress={() => { markEditing('unit'); setUnit(u); }}
            >
              <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Categoria <Text style={styles.optional}>(opcional)</Text></Text>
        <View style={[styles.selectField, showCategoryOptions && styles.selectFieldOpen]}>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowCategoryOptions((value) => !value)}>
            <Text style={[styles.selectRowText, !category && styles.selectRowPlaceholder]}>{category ?? 'Escolher categoria'}</Text>
            <Feather name={showCategoryOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          {showCategoryOptions && <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
            <TouchableOpacity
              style={[styles.selectOption, !category && styles.selectOptionActive]}
              onPress={() => { markEditing('category'); setCategory(null); setShowCategoryOptions(false); }}
            >
              <Text style={[styles.selectOptionText, !category && styles.selectOptionTextActive]}>Sem categoria</Text>
              {!category && <Feather name="check" size={16} color={Colors.accent} />}
            </TouchableOpacity>
            {(categories ?? []).map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.selectOption, category === c.label && styles.selectOptionActive]}
              onPress={() => { markEditing('category'); setCategory(c.label); setShowCategoryOptions(false); }}
            >
              <Text style={[styles.selectOptionText, category === c.label && styles.selectOptionTextActive]}>{c.label}</Text>
              {category === c.label && <Feather name="check" size={16} color={Colors.accent} />}
            </TouchableOpacity>
          ))}
          </ScrollView>}
        </View>

        <Text style={styles.label}>Data de validade <Text style={styles.optional}>(opcional)</Text></Text>
        <TouchableOpacity style={styles.selectRow} onPress={() => setExpirationPickerVisible(true)}>
          <Text style={[styles.selectRowText, !expirationDate && styles.selectRowPlaceholder]}>{expirationDate ? expirationDate.toLocaleDateString('pt-BR') : 'Selecionar data'}</Text>
          <Feather name="calendar" size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
        {expirationDate && <TouchableOpacity onPress={() => { markEditing('expirationDate'); setExpirationDate(null); }} style={styles.clearDateButton}><Text style={styles.clearDateText}>Limpar data</Text></TouchableOpacity>}
        <DatePickerModal visible={expirationPickerVisible} value={expirationDate ?? new Date()} onChange={(value) => { markEditing('expirationDate'); setExpirationDate(value); }} onClose={() => setExpirationPickerVisible(false)} />
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={updateItem.isPending}>
          {updateItem.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Salvar</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <Text style={styles.removeButtonText}>Remover item</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 10, padding: 24 },
  content: { padding: 24, gap: 10, paddingBottom: 140 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryButton: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginTop: 6 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  unitRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  unitChipTextActive: { color: '#fff' },
  selectRow: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: Colors.separator, backgroundColor: Colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  selectRowText: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  selectRowPlaceholder: { color: Colors.textSecondary, fontWeight: '500' },
  selectField: { position: 'relative' },
  selectFieldOpen: { zIndex: 30, elevation: 30 },
  selectOptions: { position: 'absolute', top: 52, left: 0, right: 0, zIndex: 40, elevation: 40, maxHeight: 260, overflow: 'hidden', borderWidth: 1, borderColor: Colors.separator, borderRadius: 12, backgroundColor: Colors.card, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  selectOptionsContent: { paddingBottom: 1 },
  selectOption: { minHeight: 42, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  selectOptionActive: { backgroundColor: Colors.accent + '12' },
  selectOptionText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  selectOptionTextActive: { color: Colors.accent, fontWeight: '800' },
  clearDateButton: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 2 },
  clearDateText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  removeButton: { borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive },
  removeButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
  optional: { fontSize: 11, color: Colors.textSecondary, fontWeight: '400', textTransform: 'none' },
});
