import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useStorages } from '../../hooks/useStorages';
import { useFridge } from '../../hooks/useFridge';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Storage } from '../../types';
import { HouseholdCardSkeleton } from '../../components/Skeleton';
import { LoadErrorState } from '../../components/LoadErrorState';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'StorageOverview'>;
};

const DEFAULT_STORAGE_ORDER = ['Geladeira', 'Freezer', 'Despensa', 'Limpeza', 'Banheiro', 'Lavanderia'];
const DEFAULT_STORAGE_RANK = new Map(DEFAULT_STORAGE_ORDER.map((name, index) => [name.toLowerCase(), index]));

export default function StorageOverviewScreen({ navigation }: Props) {
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds, isError: householdsError, isFetching: fetchingHouseholds, refetch: refetchHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const household = households?.find((h) => h.id === effectiveId);
  const { data: storages, isLoading: loadingStorages, isError: storagesError, isFetching: fetchingStorages, refetch: refetchStorages } = useStorages(effectiveId);
  const { data: items, isLoading: loadingItems, isError: itemsError, isFetching: fetchingItems, refetch: refetchItems } = useFridge(effectiveId);
  const [refreshing, setRefreshing] = React.useState(false);

  useRefreshOnFocus(refetchStorages);
  useRefreshOnFocus(refetchItems);

  React.useEffect(() => {
    navigation.setOptions({
      title: household?.name ?? 'Estoque',
      headerRight: () => (
        <TouchableOpacity onPress={() => effectiveId && navigation.navigate('StorageActivity', { householdId: effectiveId })} style={{ paddingHorizontal: 16, alignSelf: 'center' }}>
          <Text style={{ color: Colors.accent, fontSize: 15, fontWeight: '500' }}>Atividades</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, household, effectiveId]);

  const orderedStorages = React.useMemo(() => {
    return [...(storages ?? [])].sort((a, b) => {
      const rankA = DEFAULT_STORAGE_RANK.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rankB = DEFAULT_STORAGE_RANK.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [storages]);

  const countsByStorage = React.useMemo(() => {
    const counts: Record<string, number> = {};
    (items ?? []).forEach((item) => {
      const storageId = item.storageId ?? 'unknown';
      counts[storageId] = (counts[storageId] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetchStorages(), refetchItems()]);
    setRefreshing(false);
  }

  if (loadingHouseholds || loadingStorages || loadingItems) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => <HouseholdCardSkeleton key={index} />)}
        </View>
      </View>
    );
  }

  if (householdsError || !households) {
    return (
      <LoadErrorState
        title="Não consegui carregar suas casas"
        message="Confira sua conexão e tente novamente."
        isRetrying={fetchingHouseholds}
        onRetry={() => {
          void refetchHouseholds();
        }}
      />
    );
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>Crie ou entre em uma casa primeiro</Text>
      </View>
    );
  }

  if (storagesError || itemsError || !storages || !items) {
    return (
      <LoadErrorState
        title="Não consegui carregar os estoques"
        message="Confira sua conexão e tente novamente."
        isRetrying={fetchingStorages || fetchingItems}
        onRetry={() => {
          void refetchStorages();
          void refetchItems();
        }}
      />
    );
  }

  function renderStorage({ item }: { item: Storage }) {
    const count = countsByStorage[item.id] ?? 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Fridge', {
          householdId: effectiveId!,
          storageId: item.id,
          storageName: item.name,
          storageEmoji: item.emoji,
        })}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{item.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {count} {count === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        <Text style={styles.chevron}>{'\u203A'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orderedStorages}
        keyExtractor={(item) => item.id}
        renderItem={renderStorage}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Nenhum estoque visível</Text>
            <Text style={styles.emptySubtitle}>Gerencie os estoques pela aba Casa.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddFridgeItem', { householdId: effectiveId })}
        >
          <Text style={styles.buttonText}>+ Adicionar item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 8, padding: 24 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 21 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: 13, color: Colors.textSecondary },
  chevron: { fontSize: 24, color: Colors.textSecondary, fontWeight: '300' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
