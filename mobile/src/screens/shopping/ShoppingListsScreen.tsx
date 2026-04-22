import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useShoppingLists, useDeleteShoppingList } from '../../hooks/useShoppingLists';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingLists'>;
};

export default function ShoppingListsScreen({ navigation }: Props) {
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  const { data: lists, isLoading, refetch } = useShoppingLists(effectiveId);
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const deleteList = useDeleteShoppingList(effectiveId ?? '');

  React.useEffect(() => {
    if (!selectedHouseholdId && households?.[0]) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  function handleDelete(list: ShoppingList) {
    Alert.alert('Excluir lista', `Excluir "${list.name}"? Todos os itens serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteList.mutate(list.id),
      },
    ]);
  }

  if (loadingHouseholds) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>Crie ou entre em uma casa primeiro</Text>
      </View>
    );
  }

  function renderCard({ item }: { item: ShoppingList }) {
    const total = item.itemCount;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ShoppingListDetail', {
          householdId: effectiveId!,
          listId: item.id,
          listName: item.name,
        })}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {total === 0 ? 'Vazia' : `${total} ${total === 1 ? 'item' : 'itens'}`}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.place ? (
            <Text style={styles.metaChip}>📍 {item.place}</Text>
          ) : null}
          {item.category ? (
            <Text style={styles.metaChip}>🏷 {item.category}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {households && households.length > 1 && (
        <View style={styles.householdPicker}>
          {households.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={[styles.pickerItem, h.id === effectiveId && styles.pickerItemActive]}
              onPress={() => setSelectedHouseholdId(h.id)}
            >
              <Text style={[styles.pickerItemText, h.id === effectiveId && styles.pickerItemTextActive]}>
                {h.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : (
        <FlatList
          data={lists ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.list, (!lists || lists.length === 0) && styles.listEmpty]}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma lista ainda</Text>
              <Text style={styles.emptySubtitle}>Crie uma lista para começar</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CreateShoppingList', { householdId: effectiveId })}
        >
          <Text style={styles.buttonText}>+ Nova lista</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 8 },
  householdPicker: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.background },
  pickerItemActive: { backgroundColor: Colors.accent },
  pickerItemText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  pickerItemTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.separator, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.separator,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  cardMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: { fontSize: 13, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', gap: 8, paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
