import React from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { FridgeActivityEntry } from '../hooks/useFridge';
import { ShoppingActivityEvent } from '../types';
import { formatBrDate, formatBrTime } from '../utils/dateUtils';

export type ActivityScope = 'all' | 'stock' | 'shopping';

type TimelineEvent = {
  id: string;
  scope: 'stock' | 'shopping';
  kind: string;
  createdAt: string;
  userId?: string | null;
  userName: string;
  itemName: string;
  storageId?: string | null;
  storageName?: string | null;
  storageEmoji?: string | null;
  title: React.ReactNode;
  subtitle: string;
  color: string;
  icon: string;
};

type Props = {
  fridgeEvents?: FridgeActivityEntry[];
  shoppingEvents?: ShoppingActivityEvent[];
  scope?: ActivityScope;
  onScopeChange?: (scope: ActivityScope) => void;
  period?: 'all' | '7d' | '30d';
  onPeriodChange?: (period: 'all' | '7d' | '30d') => void;
  compactLimit?: number;
  showFilters?: boolean;
  showScopeFilter?: boolean;
  showPeriodFilter?: boolean;
  emptyText?: string;
  onEventPress?: (event: TimelineEvent) => void;
  newSince?: string | null;
  localUserId?: string | null;
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const now = new Date();
  const today = dayKey(now.toISOString());
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = dayKey(yesterdayDate.toISOString());
  const key = dayKey(iso);
  if (key === today) return 'Hoje';
  if (key === yesterday) return 'Ontem';
  return formatBrDate(iso);
}

function fridgeToEvent(item: FridgeActivityEntry): TimelineEvent {
  const userName = item.userName ?? 'Alguem';
  const storageLabel = item.storageName
    ? `${item.storageEmoji ? `${item.storageEmoji} ` : ''}${item.storageName}`
    : null;

  if (item.action === 'updated') {
    return {
      id: `stock-${item.id}`,
      scope: 'stock',
      kind: 'updated',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: item.itemName,
      storageId: item.storageId,
      storageName: item.storageName,
      storageEmoji: item.storageEmoji,
      color: '#3B82F6',
      icon: 'E',
      title: <><Text style={styles.strong}>{userName}</Text>{' editou '}<Text style={styles.item}>{item.itemName}</Text>{storageLabel ? <> em <Text style={styles.storage}>{storageLabel}</Text></> : null}</>,
      subtitle: item.details ? item.details : 'Estoque atualizado',
    };
  }

  if (item.action === 'removed' && item.toShoppingListName) {
    return {
      id: `stock-${item.id}`,
      scope: 'stock',
      kind: 'finished',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: item.itemName,
      storageId: item.storageId,
      storageName: item.storageName,
      storageEmoji: item.storageEmoji,
      color: Colors.accent,
      icon: '->',
      title: <><Text style={styles.strong}>{userName}</Text>{' acabou com '}<Text style={styles.item}>{item.itemName}</Text>{storageLabel ? <> de <Text style={styles.storage}>{storageLabel}</Text></> : null}</>,
      subtitle: `Mandado para a lista ${item.toShoppingListName}`,
    };
  }

  if (item.action === 'removed') {
    return {
      id: `stock-${item.id}`,
      scope: 'stock',
      kind: 'removed',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: item.itemName,
      storageId: item.storageId,
      storageName: item.storageName,
      storageEmoji: item.storageEmoji,
      color: Colors.destructive,
      icon: '-',
      title: <><Text style={styles.strong}>{userName}</Text>{' removeu '}<Text style={styles.item}>{item.itemName}</Text>{storageLabel ? <> de <Text style={styles.storage}>{storageLabel}</Text></> : null}</>,
      subtitle: 'Removido do estoque',
    };
  }

  if (item.fromShoppingListName) {
    return {
      id: `stock-${item.id}`,
      scope: 'stock',
      kind: 'sent_to_stock',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: item.itemName,
      storageId: item.storageId,
      storageName: item.storageName,
      storageEmoji: item.storageEmoji,
      color: '#8B5CF6',
      icon: '<-',
      title: <><Text style={styles.strong}>{userName}</Text>{' mandou '}<Text style={styles.item}>{item.itemName}</Text>{' da lista '}<Text style={styles.listName}>{item.fromShoppingListName}</Text></>,
      subtitle: storageLabel ? `Entrou em ${storageLabel}` : 'Entrou no estoque',
    };
  }

  return {
    id: `stock-${item.id}`,
    scope: 'stock',
    kind: 'added',
    createdAt: item.createdAt,
    userId: item.userId,
    userName,
    itemName: item.itemName,
    storageId: item.storageId,
    storageName: item.storageName,
    storageEmoji: item.storageEmoji,
    color: Colors.success,
    icon: '+',
    title: <><Text style={styles.strong}>{userName}</Text>{' adicionou '}<Text style={styles.item}>{item.itemName}</Text>{storageLabel ? <> em <Text style={styles.storage}>{storageLabel}</Text></> : null}</>,
    subtitle: 'Adicionado ao estoque',
  };
}

function shoppingToEvent(item: ShoppingActivityEvent): TimelineEvent {
  const action = item.action ?? item.type ?? 'added';
  const userName = item.userName ?? item.createdBy?.name ?? 'Alguem';
  const itemName = item.itemName ?? item.name ?? 'item';
  const listName = item.listName ?? 'lista';

  if (action === 'list_created') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'list_created',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: listName,
      color: Colors.success,
      icon: '+',
      title: <><Text style={styles.strong}>{userName}</Text>{' criou a lista '}<Text style={styles.listName}>{listName}</Text></>,
      subtitle: 'Lista de compras criada',
    };
  }

  if (action === 'list_deleted') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'list_deleted',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName: listName,
      color: Colors.destructive,
      icon: '-',
      title: <><Text style={styles.strong}>{userName}</Text>{' excluiu a lista '}<Text style={styles.listName}>{listName}</Text></>,
      subtitle: 'Lista de compras excluida',
    };
  }

  if (action === 'checked') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'checked',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName,
      color: Colors.success,
      icon: 'OK',
      title: <><Text style={styles.strong}>{userName}</Text>{' comprou '}<Text style={styles.item}>{itemName}</Text></>,
      subtitle: `Marcado na lista ${listName}`,
    };
  }

  if (action === 'unchecked') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'unchecked',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName,
      color: '#F59E0B',
      icon: '!',
      title: <><Text style={styles.strong}>{userName}</Text>{' desmarcou '}<Text style={styles.item}>{itemName}</Text></>,
      subtitle: `Voltou na lista ${listName}`,
    };
  }

  if (action === 'sent_to_fridge') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'sent_to_stock',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName,
      color: '#8B5CF6',
      icon: '->',
      title: <><Text style={styles.strong}>{userName}</Text>{' mandou '}<Text style={styles.item}>{itemName}</Text>{' para o estoque'}</>,
      subtitle: `Saiu da lista ${listName}`,
    };
  }

  if (action === 'removed') {
    return {
      id: `shopping-${item.id}`,
      scope: 'shopping',
      kind: 'removed',
      createdAt: item.createdAt,
      userId: item.userId,
      userName,
      itemName,
      color: Colors.destructive,
      icon: '-',
      title: <><Text style={styles.strong}>{userName}</Text>{' removeu '}<Text style={styles.item}>{itemName}</Text></>,
      subtitle: `Removido da lista ${listName}`,
    };
  }

  return {
    id: `shopping-${item.id}`,
    scope: 'shopping',
    kind: 'added',
    createdAt: item.createdAt,
    userId: item.userId,
    userName,
    itemName,
    color: Colors.accent,
    icon: '+',
    title: <><Text style={styles.strong}>{userName}</Text>{' adicionou '}<Text style={styles.item}>{itemName}</Text></>,
    subtitle: `Na lista ${listName}`,
  };
}

function getCutoff(period: Props['period']) {
  if (period === '7d') return Date.now() - 7 * 86400000;
  if (period === '30d') return Date.now() - 30 * 86400000;
  return null;
}

export function buildTimelineEvents(fridgeEvents?: FridgeActivityEntry[], shoppingEvents?: ShoppingActivityEvent[]) {
  return [
    ...(fridgeEvents ?? []).map(fridgeToEvent),
    ...(shoppingEvents ?? []).map(shoppingToEvent),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function ActivityTimeline({
  fridgeEvents,
  shoppingEvents,
  scope = 'all',
  onScopeChange,
  period = 'all',
  onPeriodChange,
  compactLimit,
  showFilters = true,
  showScopeFilter = true,
  showPeriodFilter = true,
  emptyText = 'Nenhuma atividade neste periodo.',
  onEventPress,
  newSince,
  localUserId,
}: Props) {
  const allEvents = buildTimelineEvents(fridgeEvents, shoppingEvents);
  const cutoff = getCutoff(period);
  const filtered = allEvents
    .filter((item) => scope === 'all' || item.scope === scope)
    .filter((item) => !cutoff || new Date(item.createdAt).getTime() >= cutoff)
    .slice(0, compactLimit ?? allEvents.length);

  const sections = filtered.reduce<Array<{ title: string; data: TimelineEvent[] }>>((acc, item) => {
    const title = dayLabel(item.createdAt);
    const current = acc[acc.length - 1];
    if (current?.title === title) {
      current.data.push(item);
    } else {
      acc.push({ title, data: [item] });
    }
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      {showFilters && (
        <>
          {showScopeFilter && (
            <View style={styles.filterRow}>
              {(['all', 'stock', 'shopping'] as ActivityScope[]).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.filterChip, scope === value && styles.filterChipActive]}
                  onPress={() => onScopeChange?.(value)}
                >
                  <Text style={[styles.filterChipText, scope === value && styles.filterChipTextActive]}>
                    {value === 'all' ? 'Tudo' : value === 'stock' ? 'Estoque' : 'Lista'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {showPeriodFilter && (
            <View style={showScopeFilter ? styles.filterRowTight : styles.filterRow}>
              {(['all', '7d', '30d'] as const).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.periodChip, period === value && styles.periodChipActive]}
                  onPress={() => onPeriodChange?.(value)}
                >
                  <Text style={[styles.periodChipText, period === value && styles.periodChipTextActive]}>
                    {value === 'all' ? 'Tudo' : value === '7d' ? '7 dias' : '30 dias'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, sections.length === 0 && styles.listEmpty]}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }) => {
          const isOwnEvent = !!localUserId && item.userId === localUserId;
          const isNew = !!newSince
            && new Date(item.createdAt).getTime() > new Date(newSince).getTime()
            && !isOwnEvent;

          return (
            <View style={styles.rowWrap}>
              {isNew && <View style={styles.newDot} />}
              <TouchableOpacity
                style={[styles.row, isNew && styles.rowNew]}
                activeOpacity={onEventPress ? 0.72 : 1}
                disabled={!onEventPress}
                onPress={() => onEventPress?.(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
                  <Text style={[styles.iconText, { color: item.color }]}>{item.icon}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.titleText}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                  <Text style={styles.time}>{formatBrTime(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  filterRowTight: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  periodChipActive: { backgroundColor: Colors.accent + '18', borderColor: Colors.accent },
  periodChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  periodChipTextActive: { color: Colors.accent },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  listEmpty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  rowWrap: { position: 'relative', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    padding: 12,
  },
  rowNew: { borderColor: Colors.accent + '55', backgroundColor: Colors.card },
  newDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    zIndex: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 12, fontWeight: '800' },
  body: { flex: 1, gap: 2 },
  titleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  strong: { fontWeight: '700' },
  item: { fontStyle: 'italic' },
  listName: { fontWeight: '700', color: Colors.accent },
  storage: { fontWeight: '700', color: '#3B82F6' },
  subtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  time: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
