import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { FridgeItem, HouseTask, ShoppingList } from '../../../types';

type AttentionSummaryModalProps = {
  visible: boolean;
  expiringItems: FridgeItem[];
  tasks: HouseTask[];
  urgentLists: ShoppingList[];
  formatDate: (date: string) => string;
  onClose: () => void;
  onOpenItem: (item: FridgeItem) => void;
  onOpenTask: (task: HouseTask) => void;
  onOpenList: (list: ShoppingList) => void;
};

export function AttentionSummaryModal({
  visible,
  expiringItems,
  tasks,
  urgentLists,
  formatDate,
  onClose,
  onOpenItem,
  onOpenTask,
  onOpenList,
}: AttentionSummaryModalProps) {
  const total = expiringItems.length + tasks.length + urgentLists.length;

  function closeAndRun(action: () => void) {
    onClose();
    requestAnimationFrame(action);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.filterModalOverlay}>
        <TouchableOpacity style={styles.filterModalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.attentionCard}>
          <View style={styles.attentionHeader}>
            <View>
              <Text style={styles.attentionTitle}>{total} {total === 1 ? 'atenção' : 'atenções'}</Text>
              <Text style={styles.attentionSubtitle}>O que precisa de cuidado hoje</Text>
            </View>
            <TouchableOpacity style={styles.attentionClose} onPress={onClose} activeOpacity={0.75}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {total === 0 ? (
            <Text style={styles.attentionEmpty}>Nada urgente por enquanto.</Text>
          ) : (
            <ScrollView style={styles.attentionScroll} contentContainerStyle={styles.attentionContent} showsVerticalScrollIndicator={false}>
              {expiringItems.length > 0 && (
                <View style={styles.attentionSection}>
                  <Text style={styles.attentionSectionTitle}>Vencendo</Text>
                  {expiringItems.slice(0, 5).map((item) => (
                    <TouchableOpacity key={item.id} style={styles.attentionRow} onPress={() => closeAndRun(() => onOpenItem(item))}>
                      <View style={[styles.attentionDot, { backgroundColor: '#F0A500' }]} />
                      <View style={styles.attentionRowText}>
                        <Text style={styles.attentionRowTitle}>{item.name}</Text>
                        <Text style={styles.attentionRowSubtitle}>{item.expirationDate ? formatDate(item.expirationDate) : 'Sem data'} · {item.storage?.name ?? 'Estoque'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {tasks.length > 0 && (
                <View style={styles.attentionSection}>
                  <Text style={styles.attentionSectionTitle}>Tarefas</Text>
                  {tasks.slice(0, 5).map((task) => (
                    <TouchableOpacity key={task.id} style={styles.attentionRow} onPress={() => closeAndRun(() => onOpenTask(task))}>
                      <View style={[styles.attentionDot, { backgroundColor: task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) ? Colors.destructive : Colors.accent }]} />
                      <View style={styles.attentionRowText}>
                        <Text style={styles.attentionRowTitle}>{task.title}</Text>
                        <Text style={styles.attentionRowSubtitle}>{task.assignedTo?.name ?? (task.assignmentType === 'all' ? 'Todos' : 'Sem responsável')}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {urgentLists.length > 0 && (
                <View style={styles.attentionSection}>
                  <Text style={styles.attentionSectionTitle}>Listas urgentes</Text>
                  {urgentLists.slice(0, 5).map((list) => (
                    <TouchableOpacity key={list.id} style={styles.attentionRow} onPress={() => closeAndRun(() => onOpenList(list))}>
                      <View style={[styles.attentionDot, { backgroundColor: Colors.destructive }]} />
                      <View style={styles.attentionRowText}>
                        <Text style={styles.attentionRowTitle}>{list.name}</Text>
                        <Text style={styles.attentionRowSubtitle}>{list.itemCount} {list.itemCount === 1 ? 'item' : 'itens'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filterModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  attentionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    maxHeight: '76%',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  attentionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  attentionTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  attentionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  attentionClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  attentionEmpty: { fontSize: 14, color: Colors.textSecondary, paddingVertical: 12 },
  attentionScroll: { maxHeight: 440 },
  attentionContent: { gap: 14, paddingBottom: 4 },
  attentionSection: { gap: 6 },
  attentionSectionTitle: { fontSize: 12, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase' },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    paddingVertical: 8,
  },
  attentionDot: { width: 8, height: 8, borderRadius: 4 },
  attentionRowText: { flex: 1, minWidth: 0 },
  attentionRowTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  attentionRowSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
