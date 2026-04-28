import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableWithoutFeedback, Keyboard, Modal,
} from 'react-native';
import { filterItems } from '../../constants/commonItems';
import DateField from '../../components/DateField';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { Colors } from '../../constants/colors';
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'AddFridgeItem'>;
  route: RouteProp<FridgeStackParamList, 'AddFridgeItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

const EMOJI_OPTIONS = ['📦', '🥛', '🍖', '🍎', '🥦', '🌾', '🥤', '🧊', '🍕', '🧀', '🥫', '🍞', '🧂', '🍽️', '🍦', '🧃'];

export default function AddFridgeItemScreen({ navigation, route }: Props) {
  const { householdId, storageId } = route.params;
  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const suggestions = useMemo(() => filterItems(name), [name]);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('un');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const addItem = useAddFridgeItem(householdId);
  const { data: categories } = useCategories(householdId, storageId ?? null);
  const createCategory = useCreateCategory(householdId, storageId ?? '');
  const deleteCategory = useDeleteCategory(householdId, storageId ?? '');

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
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

          <Text style={styles.label}>
            Categoria <Text style={styles.optional}>(opcional · segure para excluir)</Text>
          </Text>
          <View style={styles.chipRow}>
            {(categories ?? []).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, category === c.label && styles.chipActive]}
                onPress={() => setCategory(category === c.label ? null : c.label)}
                onLongPress={() => handleCategoryLongPress(c)}
                delayLongPress={500}
              >
                <Text style={[styles.chipText, category === c.label && styles.chipTextActive]}>
                  {c.emoji} {c.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addCategoryChip}
              onPress={() => setNewCatModal(true)}
            >
              <Text style={styles.addCategoryText}>+ Nova</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Data de validade <Text style={styles.optional}>(opcional)</Text></Text>
          <DateField value={expirationDate} onChange={setExpirationDate} />

          <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={addItem.isPending}>
            {addItem.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Adicionar</Text>
            }
          </TouchableOpacity>
        </ScrollView>

        {/* Modal nova categoria */}
        <Modal visible={newCatModal} transparent animationType="fade" onRequestClose={() => setNewCatModal(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setNewCatModal(false)}>
            <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
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
            </TouchableOpacity>
          </TouchableOpacity>
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
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20, width: '90%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
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
