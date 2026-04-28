import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useStorages } from '../../hooks/useStorages';
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { Colors } from '../../constants/colors';
import { HouseholdCategory, Storage } from '../../types';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'ManageCategories'>;
  route: RouteProp<HouseholdStackParamList, 'ManageCategories'>;
};

const EMOJI_OPTIONS = ['📦', '🥛', '🍖', '🍎', '🥦', '🌾', '🥤', '🧊', '🍕', '🧀', '🥫', '🍞', '🧂', '🍽️', '🍦', '🧃', '🥩', '🍪', '🍝'];

function StorageSection({ householdId, storage }: { householdId: string; storage: Storage }) {
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
    Alert.alert(`Remover "${cat.label}"?`, 'A categoria será removida deste compartimento.', [
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{storage.emoji} {storage.name}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.chips}>
          {(categories ?? []).map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.chip} onPress={() => handleDelete(cat)}>
              <Text style={styles.chipText}>{cat.emoji} {cat.label}</Text>
              <Text style={styles.chipX}>×</Text>
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

export default function ManageCategoriesScreen({ route }: Props) {
  const { householdId } = route.params;
  const { data: storages, isLoading } = useStorages(householdId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>Toque em uma categoria para removê-la. Itens já cadastrados com essa categoria não são afetados.</Text>
      {(storages ?? []).map((s) => (
        <StorageSection key={s.id} householdId={householdId} storage={s} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20, lineHeight: 18 },

  section: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.separator,
    padding: 16, marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.separator,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  chipX: { fontSize: 15, color: Colors.destructive, fontWeight: '700' },
  addChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed',
  },
  addChipText: { fontSize: 13, color: Colors.accent, fontWeight: '600' },

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
