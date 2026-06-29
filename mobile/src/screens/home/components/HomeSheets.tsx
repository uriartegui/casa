import React from 'react';
import { Animated, GestureResponderHandlers, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import ActivityTimeline from '../../../components/ActivityTimeline';
import { FridgeItem, HouseTask, ShoppingList, Storage } from '../../../types';

export type HelpSection = {
  title: string;
  body: string;
};

type HelpHighlight = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
};

type FilterValue = 'all' | string;

type HelpSheetProps = {
  visible: boolean;
  height: Animated.Value;
  translateY: Animated.Value;
  panHandlers: GestureResponderHandlers;
  sections: HelpSection[];
  subtitle?: string;
  introTitle?: string;
  introText?: string;
  highlights?: HelpHighlight[];
  groupTitle?: string;
  onClose: () => void;
};

type ActivitySheetProps = {
  visible: boolean;
  height: Animated.Value;
  translateY: Animated.Value;
  panHandlers: GestureResponderHandlers;
  activeFilterCount: number;
  fridgeEvents: any[];
  taskEvents: any[];
  newSince: string | null;
  localUserId?: string;
  onClose: () => void;
  onOpenFilters: () => void;
  onEventPress: (event: any) => void;
};

type FilterModalProps = {
  visible: boolean;
  activeFilterCount: number;
  period: FilterValue;
  storageId: FilterValue;
  kind: FilterValue;
  storages: Storage[];
  onClose: () => void;
  onClear: () => void;
  onPeriodChange: (value: any) => void;
  onStorageChange: (value: string) => void;
  onKindChange: (value: any) => void;
};

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

export function HelpSheet({
  visible,
  height,
  translateY,
  panHandlers,
  sections,
  subtitle = 'Guia rápido da Colmeia',
  introTitle = 'Como a casa fica organizada',
  introText = 'A Colmeia junta estoque, lista de compras, tarefas e atividades da casa para todo mundo saber o que tem, o que acabou e quem mexeu.',
  highlights = [
    { icon: 'box' as const, title: 'Estoque', body: 'Guarde itens com validade e categoria.' },
    { icon: 'shopping-cart' as const, title: 'Compras', body: 'Crie listas e envie comprados para o estoque.' },
    { icon: 'check-square' as const, title: 'Tarefas', body: 'Organize rotinas e responsabilidades.' },
  ],
  groupTitle = 'Home e app',
  onClose,
}: HelpSheetProps) {

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.activityOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY }] }]}>
          <Animated.View style={[styles.activitySheet, { height }]}>
            <View style={styles.sheetDragArea} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetDragHint} />
            </View>
            <View style={styles.helpHeader}>
              <View>
                <Text style={styles.helpTitle}>Ajuda</Text>
                <Text style={styles.helpSubtitle}>{subtitle}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.helpFloatingClose} onPress={onClose} activeOpacity={0.72}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView style={styles.helpScroll} contentContainerStyle={styles.helpContent} showsVerticalScrollIndicator={false}>
              <View style={styles.helpIntroCard}>
                <Text style={styles.helpIntroTitle}>{introTitle}</Text>
                <Text style={styles.helpIntroText}>{introText}</Text>
              </View>

              <View style={styles.helpHighlightGrid}>
                {highlights.map((item) => (
                  <View key={item.title} style={styles.helpHighlightCard}>
                    <View style={styles.helpHighlightIcon}>
                      <Feather name={item.icon} size={17} color={Colors.accent} />
                    </View>
                    <Text style={styles.helpHighlightTitle}>{item.title}</Text>
                    <Text style={styles.helpHighlightText}>{item.body}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.helpGroupTitle}>{groupTitle}</Text>
              {sections.map((section, index) => (
                <View key={section.title} style={styles.helpSection}>
                  <View style={styles.helpSectionNumber}>
                    <Text style={styles.helpSectionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.helpSectionBody}>
                    <Text style={styles.helpSectionTitle}>{section.title}</Text>
                    <Text style={styles.helpSectionText}>{section.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ActivitySheet({
  visible,
  height,
  translateY,
  panHandlers,
  activeFilterCount,
  fridgeEvents,
  taskEvents,
  newSince,
  localUserId,
  onClose,
  onOpenFilters,
  onEventPress,
}: ActivitySheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.activityOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY }] }]}>
          <Animated.View style={[styles.activitySheet, { height }]}>
            <View style={styles.sheetDragArea} {...panHandlers}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetDragHint} />
            </View>
            <View style={styles.activitySheetHeader}>
              <Text style={styles.activitySheetTitle}>Atividades da casa</Text>
              <View style={styles.activityHeaderActions}>
                <TouchableOpacity
                  style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
                  onPress={onOpenFilters}
                  activeOpacity={0.75}
                >
                  <Feather name="filter" size={14} color={activeFilterCount > 0 ? '#fff' : Colors.accent} />
                  <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
                    Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ActivityTimeline
              fridgeEvents={fridgeEvents}
              taskEvents={taskEvents}
              scope="stock"
              showFilters={false}
              showScopeFilter={false}
              emptyText="Nenhuma atividade nos estoques."
              onEventPress={onEventPress}
              newSince={newSince}
              localUserId={localUserId}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ActivityFilterModal({
  visible,
  activeFilterCount,
  period,
  storageId,
  kind,
  storages,
  onClose,
  onClear,
  onPeriodChange,
  onStorageChange,
  onKindChange,
}: FilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.filterModalOverlay}>
        <TouchableOpacity style={styles.filterModalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.filterModalCard}>
          <View style={styles.filterSectionHeader}>
            <Text style={styles.filterModalTitle}>Filtros</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={onClear} activeOpacity={0.75}>
                <Text style={styles.clearFiltersText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.filterLabel}>Data</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {[
              ['all', 'Tudo'],
              ['today', 'Hoje'],
              ['7d', '7 dias'],
              ['30d', '30 dias'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, period === value && styles.filterChipActive]}
                onPress={() => onPeriodChange(value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, period === value && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Estoque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            <TouchableOpacity
              style={[styles.filterChip, storageId === 'all' && styles.filterChipActive]}
              onPress={() => onStorageChange('all')}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, storageId === 'all' && styles.filterChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {storages.map((storage) => (
              <TouchableOpacity
                key={storage.id}
                style={[styles.filterChip, storageId === storage.id && styles.filterChipActive]}
                onPress={() => onStorageChange(storage.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, storageId === storage.id && styles.filterChipTextActive]}>{storage.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Ação</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
            {[
              ['all', 'Tudo'],
              ['added', 'Entrada'],
              ['removed', 'Saída'],
              ['updated', 'Edição'],
              ['from_list', 'Veio da lista'],
              ['to_list', 'Foi para lista'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, kind === value && styles.filterChipActive]}
                onPress={() => onKindChange(value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, kind === value && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.filterApplyButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.filterApplyButtonText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
  activityOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  activitySheetMotion: {
    zIndex: 2,
    elevation: 24,
  },
  activitySheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 24,
  },
  sheetDragArea: {
    minHeight: 36,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E7DCCB',
    alignSelf: 'center',
  },
  sheetDragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  helpHeader: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  helpTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  helpSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  helpFloatingClose: {
    position: 'absolute',
    top: 42,
    right: 16,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  helpScroll: { flex: 1 },
  helpContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  helpIntroCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  helpIntroTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  helpIntroText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  helpHighlightGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  helpHighlightCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.card,
    padding: 12,
  },
  helpHighlightIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '14',
    marginBottom: 8,
  },
  helpHighlightTitle: { fontSize: 13, lineHeight: 17, fontWeight: '900', color: Colors.textPrimary },
  helpHighlightText: { fontSize: 11, lineHeight: 15, color: Colors.textSecondary, marginTop: 4 },
  helpGroupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  helpSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  helpSectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  helpSectionNumberText: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  helpSectionBody: { flex: 1 },
  helpSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  helpSectionText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  activitySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  activitySheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  activityHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterButtonText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  filterButtonTextActive: { color: '#fff' },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clearFiltersText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  filterChipsRow: { gap: 8, paddingRight: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
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
  filterModalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  filterModalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  filterApplyButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  filterApplyButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
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
