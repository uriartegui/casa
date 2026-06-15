import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Storage } from '../../types';
import { useStorages, useUpdateStorage } from '../../hooks/useStorages';
import { StorageAdminCardSkeleton } from '../../components/Skeleton';

type Props = {
  route: RouteProp<HouseholdStackParamList, 'ManageStorages'>;
};

const DEFAULT_STORAGE_ORDER = ['Geladeira', 'Freezer', 'Despensa', 'Limpeza', 'Banheiro', 'Lavanderia'];

const DEFAULT_STORAGE_RANK = new Map(
  DEFAULT_STORAGE_ORDER.map((name, index) => [name.toLowerCase(), index]),
);

export default function ManageStoragesScreen({ route }: Props) {
  const { householdId } = route.params;
  const { data: storages, isLoading } = useStorages(householdId, { includeHidden: true });
  const updateStorage = useUpdateStorage(householdId);
  const [editing, setEditing] = useState<Storage | null>(null);
  const [name, setName] = useState('');
  const storageOrderRef = useRef<Record<string, number>>({});
  const nextCustomOrderRef = useRef(DEFAULT_STORAGE_ORDER.length);

  const visibleCount = (storages ?? []).filter((storage) => !storage.hidden).length;
  const orderedStorages = useMemo(() => {
    const list = storages ?? [];

    list.forEach((storage) => {
      if (storageOrderRef.current[storage.id] !== undefined) return;

      const defaultRank = DEFAULT_STORAGE_RANK.get(storage.name.toLowerCase());
      storageOrderRef.current[storage.id] = defaultRank ?? nextCustomOrderRef.current++;
    });

    return [...list].sort((a, b) => {
      const orderA = storageOrderRef.current[a.id] ?? Number.MAX_SAFE_INTEGER;
      const orderB = storageOrderRef.current[b.id] ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [storages]);

  function openRename(storage: Storage) {
    setEditing(storage);
    setName(storage.name);
  }

  async function saveRename() {
    if (!editing) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateStorage.mutateAsync({ storageId: editing.id, name: trimmed });
      setEditing(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao renomear.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  async function toggleHidden(storage: Storage) {
    if (!storage.hidden && visibleCount <= 1) {
      Alert.alert('Nao da para ocultar', 'Mantenha pelo menos um estoque visivel.');
      return;
    }

    try {
      await updateStorage.mutateAsync({ storageId: storage.id, hidden: !storage.hidden });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao atualizar.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Estoques ocultos somem da aba Estoque, mas seus itens e categorias continuam salvos.
        </Text>
        {Array.from({ length: 5 }).map((_, index) => <StorageAdminCardSkeleton key={index} />)}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        Estoques ocultos somem da aba Estoque, mas seus itens e categorias continuam salvos.
      </Text>

      {orderedStorages.map((storage) => (
        <View key={storage.id} style={[styles.row, storage.hidden && styles.rowHidden]}>
          <View style={styles.info}>
            <Text style={styles.storageName}>{storage.emoji} {storage.name}</Text>
            <Text style={styles.storageStatus}>{storage.hidden ? 'Oculto' : 'Visivel'}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openRename(storage)}>
              <Text style={styles.actionText}>Renomear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, storage.hidden ? styles.showBtn : styles.hideBtn]}
              onPress={() => toggleHidden(storage)}
              disabled={updateStorage.isPending}
            >
              <Text style={[styles.actionText, storage.hidden ? styles.showText : styles.hideText]}>
                {storage.hidden ? 'Mostrar' : 'Ocultar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setEditing(null)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Renomear estoque</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={saveRename}
              maxLength={40}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, updateStorage.isPending && { opacity: 0.6 }]}
                onPress={saveRename}
                disabled={updateStorage.isPending}
              >
                {updateStorage.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hint: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 16 },
  row: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rowHidden: { opacity: 0.65 },
  info: { gap: 2 },
  storageName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  storageStatus: { fontSize: 12, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  showBtn: { borderColor: Colors.accent },
  hideBtn: { borderColor: Colors.destructive },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  showText: { color: Colors.accent },
  hideText: { color: Colors.destructive },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '86%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.separator,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
