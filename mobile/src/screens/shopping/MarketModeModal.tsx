import React, { useMemo, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, SectionList, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListItems, useToggleListItem, useAddListItem } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { ShoppingItem } from '../../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  listId: string;
  listName: string;
};

// Hook em componente próprio para só valer enquanto o modal está montado.
function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function MarketModeModal({ visible, onClose, householdId, listId, listName }: Props) {
  const insets = useSafeAreaInsets();
  const { data: items } = useListItems(householdId, listId);
  const toggleItem = useToggleListItem(householdId, listId);
  const addItem = useAddListItem(householdId, listId);
  const [quickName, setQuickName] = useState('');

  const pending = useMemo(() => (items ?? []).filter((i) => !i.checked), [items]);
  const bought = useMemo(() => (items ?? []).filter((i) => i.checked), [items]);
  const total = pending.length + bought.length;
  const progress = total > 0 ? bought.length / total : 0;

  const sections = [
    ...(pending.length > 0 ? [{ key: 'pending', data: pending }] : []),
    ...(bought.length > 0 ? [{ key: 'bought', data: bought }] : []),
  ];

  function handleQuickAdd() {
    const name = quickName.trim();
    if (!name) return;
    setQuickName('');
    addItem.mutate({ name, quantity: 1, unit: 'un' });
  }

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
      <TouchableOpacity
        style={[styles.row, item.checked && styles.rowChecked]}
        onPress={() => toggleItem.mutate({ itemId: item.id, checked: !item.checked })}
        activeOpacity={0.6}
      >
        <View style={[styles.check, item.checked && styles.checkChecked]}>
          {item.checked && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={[styles.rowName, item.checked && styles.rowNameChecked]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.rowQty, item.checked && styles.rowNameChecked]}>
          {item.quantity} {item.unit ?? ''}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeepAwake />
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.listName} numberOfLines={1}>🛒 {listName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.exitBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.exitText}>Sair</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.progressText}>
            {bought.length}<Text style={styles.progressTotal}>/{total}</Text>
            <Text style={styles.progressLabel}>  {bought.length === total && total > 0 ? 'tudo no carrinho! 🎉' : 'no carrinho'}</Text>
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {total === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Lista vazia</Text>
            <Text style={styles.emptySub}>Use o campo abaixo para adicionar itens</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section }) =>
              section.key === 'bought' ? (
                <Text style={styles.boughtHeader}>NO CARRINHO ({bought.length})</Text>
              ) : null
            }
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={[styles.quickAdd, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.quickInput}
            placeholder="Lembrou de algo? Adiciona aqui"
            placeholderTextColor={Colors.textSecondary}
            value={quickName}
            onChangeText={setQuickName}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.quickBtn, !quickName.trim() && { opacity: 0.4 }]}
            onPress={handleQuickAdd}
            disabled={!quickName.trim()}
          >
            <Text style={styles.quickBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 12 },
  exitBtn: { backgroundColor: Colors.accent + '18', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7 },
  exitText: { color: Colors.accent, fontSize: 15, fontWeight: '700' },

  progressText: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  progressTotal: { fontSize: 22, fontWeight: '600', color: Colors.textSecondary },
  progressLabel: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  progressBar: { height: 10, borderRadius: 5, backgroundColor: Colors.separator, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: Colors.success },

  list: { paddingVertical: 8, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  rowChecked: { backgroundColor: Colors.background },
  check: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: Colors.separator,
    alignItems: 'center', justifyContent: 'center',
  },
  checkChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: '800' },
  rowName: { flex: 1, fontSize: 21, fontWeight: '600', color: Colors.textPrimary },
  rowNameChecked: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  rowQty: { fontSize: 17, fontWeight: '600', color: Colors.textSecondary },

  boughtHeader: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary },

  quickAdd: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1, borderTopColor: Colors.separator,
  },
  quickInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 16,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  quickBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  quickBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },
});
