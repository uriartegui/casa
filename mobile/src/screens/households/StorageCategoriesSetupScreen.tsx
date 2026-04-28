import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useStorages } from '../../hooks/useStorages';
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { Colors } from '../../constants/colors';
import { HouseholdCategory, Storage } from '../../types';

const EMOJI_OPTIONS = ['📦', '🥛', '🍖', '🍎', '🥦', '🌾', '🥤', '🧊', '🍕', '🧀', '🥫', '🍞', '🧂', '🍽️', '🍦', '🧃', '🥩', '🍪', '🍝'];

type Props = {
  householdId: string;
  onDone: () => void;
};

function StorageSection({
  householdId,
  storage,
}: {
  householdId: string;
  storage: Storage;
}) {
  const { data: categories, isLoading } = useCategories(householdId, storage.id);
  const createCategory = useCreateCategory(householdId, storage.id);
  const deleteCategory = useDeleteCategory(householdId, storage.id);

  const [modal, setModal] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📦');

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    try {
      await createCategory.mutateAsync({ label: trimmed, emoji });
      setModal(false);
      setLabel('');
      setEmoji('📦');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    }
  }

  function handleDelete(cat: HouseholdCategory) {
    Alert.alert(`Remover "${cat.label}"?`, '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory.mutateAsync(cat.id);
          } catch {
            Alert.alert('Erro', 'Não foi possível remover.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.storageSection} pointerEvents="box-none">
      <Text style={styles.storageTitle}>{storage.emoji} {storage.name}</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.categoryChips} pointerEvents="box-none">
          {(categories ?? []).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryChip}
              onPress={() => handleDelete(cat)}
            >
              <Text style={styles.categoryChipText}>{cat.emoji} {cat.label}</Text>
              <Text style={styles.categoryChipX}>×</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addChip} onPress={() => setModal(true)}>
            <Text style={styles.addChipText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModal(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Nova categoria — {storage.name}</Text>
            <TextInput
              style={styles.modalInput}
              value={label}
              onChangeText={setLabel}
              placeholder="Nome da categoria"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              autoCapitalize="words"
              maxLength={40}
            />
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, e === emoji && styles.emojiBtnActive]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, createCategory.isPending && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={createCategory.isPending}
              >
                {createCategory.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveText}>Criar</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function StorageCategoriesSetupScreen({ householdId, onDone }: Props) {
  const { data: storages, isLoading } = useStorages(householdId);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <Text style={styles.title}>Configure sua casa</Text>
        <Text style={styles.subtitle}>
          Personalize as categorias de cada compartimento. Toque em uma categoria para removê-la.
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
        ) : (
          (storages ?? []).map((storage) => (
            <StorageSection key={storage.id} householdId={householdId} storage={storage} />
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Pronto, entrar na casa →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 28 },

  storageSection: {
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.separator,
    padding: 16,
  },
  storageTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.separator,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  categoryChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  categoryChipX: { fontSize: 15, color: Colors.destructive, fontWeight: '700', marginLeft: 2 },
  addChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed',
  },
  addChipText: { fontSize: 13, color: Colors.accent, fontWeight: '600' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  doneBtn: { backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20, width: '90%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  modalInput: {
    borderWidth: 1, borderColor: Colors.separator, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16,
    color: Colors.textPrimary, backgroundColor: Colors.background, marginBottom: 12,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emojiBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBtnActive: { borderColor: Colors.accent, borderWidth: 2, backgroundColor: Colors.accent + '18' },
  emojiText: { fontSize: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator, alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  saveBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center' },
  saveText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
