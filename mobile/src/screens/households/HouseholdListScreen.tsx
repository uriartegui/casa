import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Household } from '../../types';
import { HouseholdCardSkeleton } from '../../components/Skeleton';
import { LoadErrorState } from '../../components/LoadErrorState';
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdList'>;
};

export default function HouseholdListScreen({ navigation }: Props) {
  const { data: households, isLoading, isError, isFetching, refetch } = useHouseholds();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  useRefreshOnFocus(refetch);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  function renderItem({ item }: { item: Household }) {
    const memberCount = item.members?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.houseTile}
        activeOpacity={0.72}
        onPress={() => navigation.navigate('HouseholdDetail', { householdId: item.id, householdName: item.name })}
      >
        <View style={styles.houseIcon}><Feather name="home" size={25} color={Colors.accent} /></View>
        <Text style={styles.houseName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.houseMeta}>{memberCount} {memberCount === 1 ? 'pessoa' : 'pessoas'}</Text>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return <View style={styles.loadingGrid}>{Array.from({ length: 4 }).map((_, index) => <HouseholdCardSkeleton key={index} />)}</View>;
  }

  if (isError || !households) {
    return (
      <LoadErrorState
        title="Não consegui carregar suas casas"
        message="Confira sua conexão e tente novamente."
        isRetrying={isFetching}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={households}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.kicker}>SUAS CASAS</Text>
            <Text style={styles.title}>Escolha uma casa</Text>
            <Text style={styles.subtitle}>Cada casa mantém seus próprios estoques, listas, tarefas e pessoas.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="home" size={42} color={Colors.accent} />
            <Text style={styles.emptyTitle}>Nenhuma casa ainda</Text>
            <Text style={styles.emptySubtitle}>Crie uma casa ou entre usando um código de convite.</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('CreateHousehold')}>
          <Text style={styles.primaryText}>+ Nova casa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('JoinHousehold')}>
          <Text style={styles.secondaryText}>Entrar com código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingGrid: { flex: 1, padding: 16, gap: 10, backgroundColor: Colors.background },
  grid: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  intro: { marginBottom: 22 },
  kicker: { fontFamily: Typography.title, color: Colors.accent, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  title: { fontFamily: Typography.display, color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { fontFamily: Typography.body, color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  row: { gap: 12, marginBottom: 12 },
  houseTile: { flex: 1, minHeight: 166, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, padding: 14, justifyContent: 'flex-end' },
  houseIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.accent + '18', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 14, left: 14 },
  houseName: { fontFamily: Typography.title, color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  houseMeta: { fontFamily: Typography.body, color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: Typography.title, color: Colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: 12 },
  emptySubtitle: { fontFamily: Typography.body, color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  primaryButton: { minHeight: 50, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: Typography.title, color: Colors.accent, fontSize: 15, fontWeight: '700' },
});
