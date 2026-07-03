import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useStorages } from '../../hooks/useStorages';
import { useCategories, useCreateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { Colors } from '../../constants/colors';
import { HouseholdCategory, Storage } from '../../types';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'ManageCategories'>;
  route: RouteProp<HouseholdStackParamList, 'ManageCategories'>;
};

function StorageSection({ householdId, storage }: { householdId: string; storage: Storage }) {
  const { data: categories, isLoading } = useCategories(householdId, storage.id);
  const createCategory = useCreateCategory(householdId, storage.id);
  const deleteCategory = useDeleteCategory(householdId, storage.id);

  const [modal, setModal] = useState(false);
  const [label, setLabel] = useState('');

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    try {
      await createCategory.mutateAsync({ label: trimmed });
      setModal(false);
      setLabel('');
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
      <Text style={styles.sectionTitle}>{storage.name}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.chips}>
          {(categories ?? []).map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.chip} onPress={() => handleDelete(cat)}>
              <Text style={styles.chipText}>{cat.label}</Text>
              <Text style={styles.chipX}>×</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addChip} onPress={() => setModal(true)}>
            <Text style={styles.addChipText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModal(false)}>
            <ScrollView
              style={styles.modalBox}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function ManageCategoriesScreen({ route }: Props) {
  const { householdId } = route.params;
  const { data: storages, isLoading } = useStorages(householdId, { includeHidden: true });

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
  content: { padding: 20, paddingBottom: 52 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hint: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },

  section: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.separator,
    padding: 17, marginBottom: 14,
  },
  sectionTitle: { fontFamily: Typography.title, fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.separator,
    minHeight: 36, paddingHorizontal: 12,
  },
  chipText: { fontFamily: Typography.rounded, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  chipX: { fontFamily: Typography.title, fontSize: 15, color: Colors.destructive, fontWeight: '700' },
  addChip: {
    minHeight: 36, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChipText: { fontFamily: Typography.title, fontSize: 13, color: Colors.accent, fontWeight: '700' },

  modalKeyboard: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: Colors.card, borderRadius: 22, width: '90%', maxHeight: '82%',
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, elevation: 10,
  },
  modalContent: { padding: 22 },
  modalTitle: { fontFamily: Typography.display, fontSize: 21, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  modalInput: {
    borderWidth: 1, borderColor: Colors.separator, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13, fontFamily: Typography.body, fontSize: 16,
    color: Colors.textPrimary, backgroundColor: Colors.background, marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, minHeight: 46, borderRadius: 14,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator, alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: Typography.title, fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  saveBtn: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: Typography.title, fontSize: 14, color: '#fff', fontWeight: '700' },
});
