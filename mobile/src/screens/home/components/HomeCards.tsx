import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { FridgeItem, HouseTask, ShoppingList } from '../../../types';
import { Typography } from '../../../theme/typography';

type TodayIntroProps = {
  householdName?: string;
  householdCount: number;
  onSelectHousehold: () => void;
};

type QuickActionsProps = {
  disabled?: boolean;
  onAddStockItem: () => void;
  onCreateShoppingList: () => void;
};

type UrgentListsProps = {
  lists: ShoppingList[];
  onOpenShopping: () => void;
  onOpenList: (list: ShoppingList) => void;
};

type TodayTasksProps = {
  tasks: HouseTask[];
  todayKey: string;
  onOpenTasks: () => void;
  onOpenTask: (task: HouseTask) => void;
};

type ExpiringItemsProps = {
  items: FridgeItem[];
  formatDate: (date: string) => string;
  onOpenItem: (item: FridgeItem) => void;
};

export function TodayIntro({ householdName, householdCount, onSelectHousehold }: TodayIntroProps) {
  return (
    <View style={styles.todayIntro}>
      <TouchableOpacity
        style={styles.todayHousehold}
        activeOpacity={householdCount > 1 ? 0.72 : 1}
        onPress={onSelectHousehold}
      >
        <Text style={styles.todayEyebrow}>{householdName ?? 'Casa'}</Text>
        {householdCount > 1 && <Feather name="chevron-down" size={14} color={Colors.accent} />}
      </TouchableOpacity>
      <Text style={styles.todayTitle}>Hoje</Text>
    </View>
  );
}

export function QuickActionsCard({ disabled, onAddStockItem, onCreateShoppingList }: QuickActionsProps) {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[styles.primaryAction, disabled && styles.actionDisabled]}
        activeOpacity={0.82}
        onPress={onAddStockItem}
        disabled={disabled}
      >
        <View style={styles.primaryActionIcon}>
          <Feather name="plus" size={22} color="#fff" />
        </View>
        <View style={styles.actionTextBlock}>
          <Text style={styles.primaryActionTitle}>Adicionar item</Text>
          <Text style={styles.primaryActionSubtitle}>Estoque da casa</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryAction, disabled && styles.actionDisabled]}
        activeOpacity={0.82}
        onPress={onCreateShoppingList}
        disabled={disabled}
      >
        <Feather name="list" size={21} color={Colors.accent} />
        <View style={styles.actionTextBlock}>
          <Text style={styles.secondaryActionTitle}>Nova lista</Text>
          <Text style={styles.secondaryActionSubtitle}>Compras</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function UrgentListsCard({ lists, onOpenShopping, onOpenList }: UrgentListsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Feather name="alert-octagon" size={17} color={Colors.destructive} />
          <Text style={styles.cardTitle}>Lista Urgente</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onOpenShopping}>
          <Text style={styles.cardLink}>Ver lista {'->'}</Text>
        </TouchableOpacity>
      </View>

      {lists.length > 0 ? (
        lists.slice(0, 3).map((list) => (
          <TouchableOpacity
            key={list.id}
            style={styles.itemRow}
            activeOpacity={0.75}
            onPress={() => onOpenList(list)}
          >
            <View style={styles.itemDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{list.name}</Text>
              <Text style={styles.itemStorage}>{list.itemCount} {list.itemCount === 1 ? 'item' : 'itens'}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyCardText}>Nenhuma lista urgente.</Text>
      )}
    </View>
  );
}

export function TodayTasksCard({ tasks, todayKey, onOpenTasks, onOpenTask }: TodayTasksProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Tarefas de hoje</Text>
        </View>
        <TouchableOpacity onPress={onOpenTasks}>
          <Text style={styles.cardLink}>Ver tarefas {'->'}</Text>
        </TouchableOpacity>
      </View>
      {tasks.length ? tasks.map((task) => (
        <TouchableOpacity key={task.id} style={styles.itemRow} onPress={() => onOpenTask(task)}>
          <View style={[styles.itemDot, { backgroundColor: task.dueDate && task.dueDate < todayKey ? Colors.destructive : Colors.accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{task.title}</Text>
            <Text style={styles.itemStorage}>{task.assignedTo?.name ? task.assignedTo.name : task.assignmentType === 'all' ? 'Todos' : 'Sem responsável'}</Text>
          </View>
        </TouchableOpacity>
      )) : <Text style={styles.emptyCardText}>Nenhuma tarefa importante hoje.</Text>}
    </View>
  );
}

export function ExpiringItemsCard({ items, formatDate, onOpenItem }: ExpiringItemsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Feather name="alert-triangle" size={17} color="#F0A500" />
          <Text style={styles.cardTitle}>Vencendo</Text>
        </View>
      </View>

      {items.length > 0 ? (
        items.slice(0, 3).map((item) => (
          <TouchableOpacity key={item.id} style={styles.itemRow} activeOpacity={0.72} onPress={() => onOpenItem(item)}>
            <View style={[styles.itemDot, { backgroundColor: '#F0A500' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemStorage}>{item.storage?.name ?? 'Estoque'}</Text>
            </View>
            <Text style={styles.itemQty}>{item.expirationDate ? formatDate(item.expirationDate) : ''}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyCardText}>Nenhum item próximo do vencimento.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  todayIntro: {
    marginTop: -2,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  todayEyebrow: {
    fontFamily: Typography.title,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
  },
  todayHousehold: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2, alignSelf: 'flex-start' },
  todayTitle: {
    fontFamily: Typography.display,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 1.25,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionDisabled: { opacity: 0.45 },
  primaryActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextBlock: { flex: 1, minWidth: 0 },
  primaryActionTitle: { fontFamily: Typography.title, color: '#fff', fontSize: 15, fontWeight: '900' },
  primaryActionSubtitle: { fontFamily: Typography.rounded, color: '#fff', opacity: 0.9, fontSize: 12, fontWeight: '700', marginTop: 1 },
  secondaryActionTitle: { fontFamily: Typography.title, color: Colors.textPrimary, fontSize: 15, fontWeight: '900' },
  secondaryActionSubtitle: { fontFamily: Typography.rounded, color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  cardTitle: { fontFamily: Typography.title, fontSize: 16, lineHeight: 20, fontWeight: '800', color: Colors.textPrimary },
  cardLink: { fontFamily: Typography.rounded, fontSize: 12, color: Colors.accent, fontWeight: '700' },
  emptyCardText: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, paddingTop: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    gap: 10,
  },
  itemDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  itemName: { fontFamily: Typography.rounded, flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  itemStorage: { fontFamily: Typography.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemQty: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary },
});
