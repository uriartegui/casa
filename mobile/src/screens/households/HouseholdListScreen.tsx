import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Household } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdList'>;
};

export default function HouseholdListScreen({ navigation }: Props) {
  const { data: households, isLoading, refetch } = useHouseholds();
  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  function renderItem({ item }: { item: Household }) {
    const memberCount = item.members?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('HouseholdDetail', { householdId: item.id, householdName: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardIconWrap}>
            <Text style={styles.cardIconEmoji}>🏠</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {memberCount > 0 && (
              <Text style={styles.cardMeta}>
                {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.cardChevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={households ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏠</Text>
            <Text style={styles.emptyTitle}>Nenhuma casa ainda</Text>
            <Text style={styles.emptySubtitle}>Crie uma casa ou entre com um código de convite</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateHousehold')}>
          <Text style={styles.buttonText}>+ Nova casa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => navigation.navigate('JoinHousehold')}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Entrar com código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  list: { padding: 16, gap: 10, flexGrow: 1 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  cardIconEmoji: { fontSize: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: 13, color: Colors.textSecondary },
  cardChevron: { fontSize: 22, color: Colors.textSecondary, fontWeight: '300' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 28, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: Colors.accent },
});
