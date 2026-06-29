import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableWithoutFeedback, Keyboard, Modal,
} from 'react-native';
import { filterItems } from '../../constants/commonItems';
import DatePickerModal from '../../components/DatePickerModal';
import NativeSelect from '../../components/NativeSelect';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'AddFridgeItem'>;
  route: RouteProp<FridgeStackParamList, 'AddFridgeItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

const EMOJI_OPTIONS = ['📦', '🥛', '🍖', '🍎', '🥦', '🌾', '🥤', '🧊', '🍕', '🧀', '🥫', '🍞', '🧂', '🍽️', '🍦', '🧃'];

export default function AddFridgeItemScreen({ navigation, route }: Props) {
  const { householdId, storageId: routeStorageId } = route.params;
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const suggestions = useMemo(() => filterItems(name), [name]);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('un');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [expirationPickerVisible, setExpirationPickerVisible] = useState(false);

  // Quando a tela abre sem compartimento (ex.: atalho da Home), o usuário
  // escolhe um; item sem compartimento nao aparece no estoque.
  const { data: storages } = useStorages(householdId);
  const [pickedStorageId, setPickedStorageId] = useState<string | null>(routeStorageId ?? null);
  const storageId = pickedStorageId ?? undefined;
  const addItem = useAddFridgeItem(householdId);
  const { data: categories } = useCategories(householdId, storageId ?? null);
  const createCategory = useCreateCategory(householdId, storageId ?? '');
  const deleteCategory = useDeleteCategory(householdId, storageId ?? '');
  const selectedCategory = categories?.find((item) => item.label === category);

  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    if (!storageId) {
      Alert.alert('Escolha onde guardar', 'Selecione um estoque antes de adicionar o item.');
      return;
    }
    try {
      const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : undefined;
      await addItem.mutateAsync({ name: name.trim(), quantity: qty, unit, storageId, expirationDate: expStr, category: category ?? undefined });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  async function handleCreateCategory() {
    const trimmed = newCatLabel.trim();
    if (!trimmed) return;
    try {
      const created = await createCategory.mutateAsync({ label: trimmed, emoji: newCatEmoji });
      setCategory(created.label);
      setNewCatModal(false);
      setNewCatLabel('');
      setNewCatEmoji('📦');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao criar categoria.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  function handleCategoryLongPress(cat: { id: string; label: string }) {
    Alert.alert(`Categoria "${cat.label}"`, 'Deseja excluir esta categoria?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(cat.id);
            if (category === cat.label) setCategory(null);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a categoria.');
          }
        },
      },
    ]);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Nome do item</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Leite"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setTimeout(() => setNameFocused(false), 150)}
            returnKeyType="next"
            autoCorrect={false}
            spellCheck={false}
          />
          {nameFocused && suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionItem}
                  onPress={() => { setName(s); setNameFocused(false); Keyboard.dismiss(); }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={Colors.textSecondary}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />

          <Text style={styles.label}>Unidade</Text>
          <View style={styles.chipRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(storages?.length ?? 0) > 0 && (
            <>
              <Text style={styles.label}>Compartimento</Text>
              {/* Dropdown anterior mantido como referencia durante a troca para o seletor nativo.
              <View style={[styles.selectField, showStorageOptions && styles.selectFieldOpen]}>
                <TouchableOpacity
                  style={[styles.selectRow, routeStorageId ? styles.selectRowLocked : null]}
                  onPress={() => {
                    if (routeStorageId) return;
                    setShowStorageOptions((value) => !value);
                    setShowCategoryOptions(false);
                  }}
                  activeOpacity={routeStorageId ? 1 : 0.7}
                >
                  <Text style={[styles.selectRowText, !selectedStorage && styles.selectRowPlaceholder]}>
                    {selectedStorage ? `${selectedStorage.emoji} ${selectedStorage.name}` : 'Escolher compartimento'}
                  </Text>
                  {!routeStorageId && <Feather name={showStorageOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />}
                </TouchableOpacity>
                {showStorageOptions && !routeStorageId && (
                  <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
                  {(storages ?? []).map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.selectOption, storageId === s.id && styles.selectOptionActive]}
                      onPress={() => {
                        setPickedStorageId(s.id);
                        setCategory(null);
                        setShowStorageOptions(false);
                        setShowCategoryOptions(false);
                      }}
                    >
                      <Text style={[styles.selectOptionText, storageId === s.id && styles.selectOptionTextActive]}>{s.name}</Text>
                      {storageId === s.id && <Feather name="check" size={16} color={Colors.accent} />}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
                )}
              </View>
              */}
              <NativeSelect
                value={storageId ?? ''}
                placeholder="Escolher compartimento"
                disabled={!!routeStorageId}
                options={(storages ?? []).map((storage) => ({ label: storage.name, value: storage.id }))}
                onChange={(nextStorageId) => {
                  setPickedStorageId(nextStorageId || null);
                  setCategory(null);
                }}
              />
            </>
          )}

          <Text style={styles.label}>
            Categoria <Text style={styles.optional}>(opcional · segure para excluir)</Text>
          </Text>
          {/* Dropdown anterior mantido como referencia durante a troca para o seletor nativo.
          <View style={[styles.selectField, showCategoryOptions && styles.selectFieldOpen]}>
            <TouchableOpacity
              style={[styles.selectRow, !storageId && styles.selectRowDisabled]}
              onPress={() => {
                if (!storageId) return;
                setShowCategoryOptions((value) => !value);
                setShowStorageOptions(false);
              }}
            >
              <Text style={[styles.selectRowText, !category && styles.selectRowPlaceholder]}>
                {category ?? (storageId ? 'Escolher categoria' : 'Escolha um compartimento primeiro')}
              </Text>
              <Feather name={showCategoryOptions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showCategoryOptions && storageId && (
            <ScrollView style={styles.selectOptions} contentContainerStyle={styles.selectOptionsContent} nestedScrollEnabled showsVerticalScrollIndicator>
            <TouchableOpacity
              style={[styles.selectOption, !category && styles.selectOptionActive]}
              onPress={() => {
                setCategory(null);
                setShowCategoryOptions(false);
              }}
            >
              <Text style={[styles.selectOptionText, !category && styles.selectOptionTextActive]}>Sem categoria</Text>
              {!category && <Feather name="check" size={16} color={Colors.accent} />}
            </TouchableOpacity>
            {(categories ?? []).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.selectOption, category === c.label && styles.selectOptionActive]}
                onPress={() => {
                  setCategory(c.label);
                  setShowCategoryOptions(false);
                }}
                onLongPress={() => handleCategoryLongPress(c)}
                delayLongPress={500}
              >
                <Text style={[styles.selectOptionText, category === c.label && styles.selectOptionTextActive]}>{c.label}</Text>
                {category === c.label && <Feather name="check" size={16} color={Colors.accent} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.selectOption} onPress={() => setNewCatModal(true)}>
              <Text style={styles.selectOptionText}>Nova categoria</Text>
              <Feather name="plus" size={16} color={Colors.accent} />
            </TouchableOpacity>
            </ScrollView>
            )}
          </View>
          */}
          <NativeSelect
            value={storageId ? category ?? '__none__' : ''}
            placeholder={storageId ? 'Escolher categoria' : 'Escolha um compartimento primeiro'}
            disabled={!storageId}
            options={[
              { label: 'Sem categoria', value: '__none__' },
              ...(categories ?? []).map((item) => ({ label: item.label, value: item.label })),
            ]}
            onChange={(nextCategory) => setCategory(nextCategory === '__none__' ? null : nextCategory)}
          />
          {storageId && (
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.inlineAction} onPress={() => setNewCatModal(true)}>
                <Feather name="plus" size={15} color={Colors.accent} />
                <Text style={styles.inlineActionText}>Nova categoria</Text>
              </TouchableOpacity>
              {selectedCategory && (
                <TouchableOpacity style={styles.inlineAction} onPress={() => handleCategoryLongPress(selectedCategory)}>
                  <Feather name="trash-2" size={15} color={Colors.destructive} />
                  <Text style={[styles.inlineActionText, styles.inlineDangerText]}>Excluir categoria</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.label}>Data de validade <Text style={styles.optional}>(opcional)</Text></Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => setExpirationPickerVisible(true)}>
            <Text style={[styles.selectRowText, !expirationDate && styles.selectRowPlaceholder]}>
              {expirationDate ? expirationDate.toLocaleDateString('pt-BR') : 'Selecionar data'}
            </Text>
            <Feather name="calendar" size={17} color={Colors.textSecondary} />
          </TouchableOpacity>
          {expirationDate && <TouchableOpacity onPress={() => setExpirationDate(null)} style={styles.clearDateButton}><Text style={styles.clearDateText}>Limpar data</Text></TouchableOpacity>}
          <DatePickerModal visible={expirationPickerVisible} value={expirationDate ?? new Date()} onChange={setExpirationDate} onClose={() => setExpirationPickerVisible(false)} />

          <TouchableOpacity
            style={[styles.button, (!storageId || addItem.isPending) && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={!storageId || addItem.isPending}
          >
            {addItem.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{storageId ? 'Adicionar' : 'Escolha um compartimento'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>

        {/* Modal nova categoria */}
        <Modal visible={newCatModal} transparent animationType="fade" onRequestClose={() => setNewCatModal(false)}>
          <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setNewCatModal(false)}>
              <ScrollView
                style={styles.modalBox}
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                showsVerticalScrollIndicator={false}
              >
              <Text style={styles.modalTitle}>Nova categoria</Text>

              <TextInput
                style={styles.modalInput}
                value={newCatLabel}
                onChangeText={setNewCatLabel}
                placeholder="Nome da categoria"
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                autoCapitalize="words"
                maxLength={40}
              />

              <Text style={styles.modalEmojiLabel}>Emoji</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, e === newCatEmoji && styles.emojiBtnActive]}
                    onPress={() => setNewCatEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNewCatModal(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, createCategory.isPending && { opacity: 0.6 }]}
                  onPress={handleCreateCategory}
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.modalSaveText}>Criar</Text>
                  }
                </TouchableOpacity>
              </View>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10, paddingBottom: 120 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  optional: { fontSize: 11, color: Colors.textSecondary, fontWeight: '400', textTransform: 'none' },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
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
  selectRowLocked: { opacity: 0.85 },
  selectRowDisabled: { opacity: 0.65 },
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
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: -2 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  inlineActionText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  inlineDangerText: { color: Colors.destructive },
  selectRowToggle: { fontSize: 18, color: Colors.accent, fontWeight: '800', lineHeight: 22 },
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
  compactAddChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
  },
  addCategoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed',
  },
  addCategoryText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
  suggestions: {
    backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.separator, overflow: 'hidden', marginTop: -6,
  },
  suggestionItem: {
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  suggestionText: { fontSize: 15, color: Colors.textPrimary },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 20, textAlign: 'center' },

  // Modal
  modalKeyboard: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: Colors.card, borderRadius: 16, width: '90%', maxHeight: '82%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  modalInput: {
    borderWidth: 1, borderColor: Colors.separator, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.background, marginBottom: 14,
  },
  modalEmojiLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBtnActive: { borderColor: Colors.accent, borderWidth: 2, backgroundColor: Colors.accent + '18' },
  emojiText: { fontSize: 22 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  modalSaveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
