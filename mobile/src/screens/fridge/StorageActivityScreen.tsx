import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { FridgeActivityEntry, useFridgeActivity } from '../../hooks/useFridge';
import { formatBrDate, formatBrTime } from '../../utils/dateUtils';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'StorageActivity'>;
  route: RouteProp<FridgeStackParamList, 'StorageActivity'>;
};

type FilterPeriod = 7 | 30 | null;

export default function StorageActivityScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: activityLog } = useFridgeActivity(householdId);
  const [filter, setFilter] = React.useState<FilterPeriod>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: 'Atividade' });
  }, [navigation]);

  const filtered = React.useMemo(() => {
    const cutoff = filter ? Date.now() - filter * 86400000 : null;
    return (activityLog ?? []).filter((item) => !cutoff || new Date(item.createdAt).getTime() >= cutoff);
  }, [activityLog, filter]);

  function getActivityColor(item: FridgeActivityEntry) {
    if (item.action === 'updated') return '#3B82F6';
    if (item.action === 'removed' && item.toShoppingListName) return Colors.accent;
    if (item.action === 'removed') return Colors.destructive;
    if (item.fromShoppingListName) return '#8B5CF6';
    return Colors.success;
  }

  function getStorageLabel(item: FridgeActivityEntry) {
    if (!item.storageName) return null;
    return `${item.storageEmoji ? `${item.storageEmoji} ` : ''}${item.storageName}`;
  }

  function renderActivityText(item: FridgeActivityEntry) {
    const storageLabel = getStorageLabel(item);
    const userName = item.userName ?? 'Alguem';

    if (item.action === 'updated') {
      return <><Text style={styles.activityName}>{userName}</Text>{' editou '}<Text style={styles.activityItem}>{item.itemName}</Text>{storageLabel ? <> em <Text style={styles.activityStorage}>{storageLabel}</Text></> : null}{item.details ? <> ({item.details})</> : null}</>;
    }

    if (item.action === 'removed' && item.toShoppingListName) {
      return <><Text style={styles.activityName}>{userName}</Text>{' removeu '}<Text style={styles.activityItem}>{item.itemName}</Text>{storageLabel ? <> de <Text style={styles.activityStorage}>{storageLabel}</Text></> : null}{' e mandou para a lista '}<Text style={styles.activityListName}>{item.toShoppingListName}</Text></>;
    }

    if (item.action === 'removed') {
      return <><Text style={styles.activityName}>{userName}</Text>{' removeu '}<Text style={styles.activityItem}>{item.itemName}</Text>{storageLabel ? <> de <Text style={styles.activityStorage}>{storageLabel}</Text></> : null}</>;
    }

    if (item.fromShoppingListName) {
      return <><Text style={styles.activityName}>{userName}</Text>{' mandou '}<Text style={styles.activityItem}>{item.itemName}</Text>{' da lista '}<Text style={styles.activityListName}>{item.fromShoppingListName}</Text>{storageLabel ? <> para <Text style={styles.activityStorage}>{storageLabel}</Text></> : null}</>;
    }

    return <><Text style={styles.activityName}>{userName}</Text>{' adicionou '}<Text style={styles.activityItem}>{item.itemName}</Text>{storageLabel ? <> em <Text style={styles.activityStorage}>{storageLabel}</Text></> : null}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {([null, 7, 30] as const).map((period) => (
          <TouchableOpacity
            key={String(period)}
            style={[styles.filterChip, filter === period && styles.filterChipActive]}
            onPress={() => setFilter(period)}
          >
            <Text style={[styles.filterChipText, filter === period && styles.filterChipTextActive]}>
              {period === null ? 'Tudo' : period === 7 ? '7 dias' : '30 dias'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma atividade neste periodo.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.activityRow}>
            <View style={[styles.activityDot, { backgroundColor: getActivityColor(item) }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{renderActivityText(item)}</Text>
              <Text style={styles.activityTime}>
                {formatBrDate(item.createdAt)}
                {' - '}
                {formatBrTime(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  activityName: { fontWeight: '600' },
  activityListName: { fontWeight: '600', color: Colors.accent },
  activityStorage: { fontWeight: '600', color: '#3B82F6' },
  activityItem: { fontStyle: 'italic' },
  activityTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
