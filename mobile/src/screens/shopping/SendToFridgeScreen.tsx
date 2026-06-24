import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { useCategories, useHouseholdCategoryGroups } from '../../hooks/useCategories';
import { useRemoveListItem } from '../../hooks/useShoppingLists';
import { useToast } from '../../context/ToastContext';
import DatePickerModal from '../../components/DatePickerModal';
import NativeSelect from '../../components/NativeSelect';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'SendToFridge'>;
  route: RouteProp<ShoppingStackParamList, 'SendToFridge'>;
};

export default function SendToFridgeScreen({ navigation, route }: Props) {
  const { householdId, listId, itemId, prefillName, prefillQuantity, prefillUnit, prefillCategory, listName } = route.params;

  const { data: storages } = useStorages(householdId);
  const { data: categoryGroups } = useHouseholdCategoryGroups(householdId);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [category, setCategory] = useState(prefillCategory ?? '');
  const [showStorageOptions, setShowStorageOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [expirationPickerVisible, setExpirationPickerVisible] = useState(false);
  const [didApplyPrefill, setDidApplyPrefill] = useState(false);
  const { data: categories } = useCategories(householdId, selectedStorageId);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (!prefillCategory || !storages || storages.length === 0 || selectedStorageId !== null) return;

    const categoryStorage = categoryGroups.find((group) => group.categories.some((cat) => cat.label === prefillCategory));
    if (categoryStorage) setSelectedStorageId(categoryStorage.storageId);
  }, [storages, selectedStorageId, categoryGroups, prefillCategory]);

  React.useEffect(() => {
    if (!prefillCategory || didApplyPrefill || !categoryGroups.length) return;
    const categoryStorage = categoryGroups.find((group) => group.categories.some((cat) => cat.label === prefillCategory));
    if (categoryStorage) {
      setSelectedStorageId(categoryStorage.storageId);
      setCategory(prefillCategory);
      setDidApplyPrefill(true);
    }
  }, [prefillCategory, didApplyPrefill, categoryGroups]);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const addToFridge = useAddFridgeItem(householdId);
  const removeFromList = useRemoveListItem(householdId, listId);

  async function handleSend() {
    if (!selectedStorageId) {
      Alert.alert('Escolha onde guardar', 'Selecione um estoque antes de continuar.');
      return;
    }

    const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : undefined;
    try {
      await addToFridge.mutateAsync({
        name: prefillName,
        quantity: Number(prefillQuantity),
        unit: prefillUnit ?? 'un',
        storageId: selectedStorageId ?? undefined,
        category: category.trim() || undefined,
        expirationDate: expStr,
        fromShoppingListName: listName,
      });
      await removeFromList.mutateAsync({ itemId, reason: 'sent_to_fridge' });
      const storageName = storages?.find((storage) => storage.id === selectedStorageId)?.name ?? 'estoque';
      showToast(`${prefillName} guardado em ${storageName}`, 'success');
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  const isPending = addToFridge.isPending || removeFromList.isPending;
  const canSend = !!selectedStorageId && !isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.itemPreview}>
          <Text style={styles.itemName}>{prefillName}</Text>
          <Text style={styles.itemQty}>{prefillQuantity} {prefillUnit}</Text>
        </View>

        {storages && storages.length > 0 && (
          <>
            <Text style={styles.label}>Compartimento</Text>
            {!selectedStorageId && (
              <Text style={styles.helperText}>Escolha onde guardar este item.</Text>
            )}
            {/* Dropdown anterior mantido como referencia durante a troca para o seletor nativo.
            <View style={[styles.selectField, showStorageOptions && styles.selectFieldOpen]}>
              <TouchableOpacity style={styles.selectRow} onPress={() => { setShowStorageOptions((value) => !value); setShowCategoryOptions(false); }}>
                <Text style={[styles.selectRowText, !selectedStorageId && styles.selectRowPlaceholder]}>{storages.find((storage) => storage.id === selectedStorageId)?.name ?? 'Escolher compartimento'}</Text>
                <Feather name={showStorageOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showStorageOptions && <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
              {storages.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.selectOption, selectedStorageId === s.id && styles.selectOptionActive]}
                  onPress={() => { setSelectedStorageId(s.id); setCategory(''); setShowStorageOptions(false); }}
                >
                  <Text style={[styles.selectOptionText, selectedStorageId === s.id && styles.selectOptionTextActive]}>{s.name}</Text>
                  {selectedStorageId === s.id && <Feather name="check" size={16} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
              </ScrollView>}
            </View>
            */}
            <NativeSelect
              value={selectedStorageId ?? ''}
              placeholder="Escolher compartimento"
              options={storages.map((storage) => ({ label: storage.name, value: storage.id }))}
              onChange={(storageId) => {
                setSelectedStorageId(storageId || null);
                setCategory('');
              }}
            />
          </>
        )}

        {(categories?.length ?? 0) > 0 && (
          <>
            <Text style={styles.label}>Categoria (opcional)</Text>
            {/* Dropdown anterior mantido como referencia durante a troca para o seletor nativo.
            <View style={[styles.selectField, showCategoryOptions && styles.selectFieldOpen]}>
              <TouchableOpacity style={styles.selectRow} onPress={() => { setShowCategoryOptions((value) => !value); setShowStorageOptions(false); }}>
                <Text style={[styles.selectRowText, !category && styles.selectRowPlaceholder]}>{category || 'Escolher categoria'}</Text>
                <Feather name={showCategoryOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showCategoryOptions && <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
                <TouchableOpacity style={[styles.selectOption, !category && styles.selectOptionActive]} onPress={() => { setCategory(''); setShowCategoryOptions(false); }}>
                  <Text style={[styles.selectOptionText, !category && styles.selectOptionTextActive]}>Sem categoria</Text>
                  {!category && <Feather name="check" size={16} color={Colors.accent} />}
                </TouchableOpacity>
              {(categories ?? []).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.selectOption, category === cat.label && styles.selectOptionActive]}
                  onPress={() => { setCategory(cat.label); setShowCategoryOptions(false); }}
                >
                  <Text style={[styles.selectOptionText, category === cat.label && styles.selectOptionTextActive]}>{cat.label}</Text>
                  {category === cat.label && <Feather name="check" size={16} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
              </ScrollView>}
            </View>
            */}
            <NativeSelect
              value={category || '__none__'}
              options={[
                { label: 'Sem categoria', value: '__none__' },
                ...(categories ?? []).map((item) => ({ label: item.label, value: item.label })),
              ]}
              onChange={(nextCategory) => setCategory(nextCategory === '__none__' ? '' : nextCategory)}
            />
          </>
        )}

        <Text style={styles.label}>Validade <Text style={styles.optional}>(opcional)</Text></Text>
        <TouchableOpacity style={styles.selectRow} onPress={() => setExpirationPickerVisible(true)}>
          <Text style={[styles.selectRowText, !expirationDate && styles.selectRowPlaceholder]}>{expirationDate ? expirationDate.toLocaleDateString('pt-BR') : 'Selecionar data'}</Text>
          <Feather name="calendar" size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
        {expirationDate && <TouchableOpacity onPress={() => setExpirationDate(null)} style={styles.clearDateButton}><Text style={styles.clearDateText}>Limpar data</Text></TouchableOpacity>}
        <DatePickerModal visible={expirationPickerVisible} value={expirationDate ?? new Date()} onChange={setExpirationDate} onClose={() => setExpirationPickerVisible(false)} />

        <TouchableOpacity
          style={[styles.button, !canSend && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{selectedStorageId ? 'Adicionar ao estoque' : 'Escolha um estoque'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10, paddingBottom: 140 },
  itemPreview: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.separator, marginBottom: 8,
  },
  itemName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  itemQty: { fontSize: 14, color: Colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  helperText: { fontSize: 13, color: Colors.textSecondary, marginTop: -2 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
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
});
