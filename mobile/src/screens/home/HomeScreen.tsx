import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge } from '../../hooks/useFridge';
import { useShoppingList } from '../../hooks/useShoppingList';
import { Colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/AppTabs';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();

  // Auto-select first household if none selected yet
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;
  useEffect(() => {
    if (!selectedHouseholdId && households && households.length > 0) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId]);

  const household = households?.find((h) => h.id === effectiveId);

  const { data: fridgeItems, isLoading: fridgeLoading } = useFridge(effectiveId);
  const { data: shoppingItems, isLoading: shoppingLoading } = useShoppingList(effectiveId);

  const firstName = user?.name?.split(' ')[0] ?? 'você';

  const pendingItems = (shoppingItems ?? []).filter((i) => !i.checked).slice(0, 5);
  const totalItems = shoppingItems?.length ?? 0;
  const checkedItems = shoppingItems?.filter((i) => i.checked).length ?? 0;
  const progress = totalItems > 0 ? checkedItems / totalItems : 0;

  const recentFridge = (fridgeItems ?? []).slice(-4).reverse();

  function goToListaTab() {
    navigation.getParent()?.navigate('ListaTab' as never);
  }

  function goToGeladeirTab() {
    navigation.getParent()?.navigate('GeladeirTab' as never);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {firstName}! 👋</Text>
        {household && (
          <Text style={styles.householdName}>🏠 {household.name}</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => effectiveId && navigation.navigate('AddFridgeItem', { householdId: effectiveId })}
          disabled={!effectiveId}
        >
          <Text style={styles.quickBtnIcon}>🧊</Text>
          <Text style={styles.quickBtnText}>+ Geladeira</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => effectiveId && navigation.navigate('AddShoppingItem', { householdId: effectiveId })}
          disabled={!effectiveId}
        >
          <Text style={styles.quickBtnIcon}>🛒</Text>
          <Text style={styles.quickBtnText}>+ Lista</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Compras Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📋 Lista de Compras</Text>
          <TouchableOpacity onPress={goToListaTab}>
            <Text style={styles.cardLink}>Ver completa →</Text>
          </TouchableOpacity>
        </View>

        {shoppingLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : totalItems === 0 ? (
          <Text style={styles.emptyText}>Lista vazia. Que tal adicionar algo?</Text>
        ) : (
          <>
            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {checkedItems}/{totalItems}
              </Text>
            </View>

            {/* Pending items */}
            {pendingItems.length === 0 ? (
              <Text style={styles.allDoneText}>Tudo comprado! 🎉</Text>
            ) : (
              pendingItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity > 0 && (
                    <Text style={styles.itemQty}>
                      {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </Text>
                  )}
                </View>
              ))
            )}

            {(shoppingItems?.filter((i) => !i.checked).length ?? 0) > 5 && (
              <TouchableOpacity onPress={goToListaTab}>
                <Text style={styles.moreText}>
                  + {(shoppingItems?.filter((i) => !i.checked).length ?? 0) - 5} itens a mais
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Geladeira Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🧊 Geladeira</Text>
          <TouchableOpacity onPress={goToGeladeirTab}>
            <Text style={styles.cardLink}>Ver geladeira →</Text>
          </TouchableOpacity>
        </View>

        {fridgeLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : recentFridge.length === 0 ? (
          <Text style={styles.emptyText}>Geladeira vazia.</Text>
        ) : (
          recentFridge.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemName}>{item.name}</Text>
              {item.storage && (
                <Text style={styles.itemStorage}>
                  {item.storage.emoji} {item.storage.name}
                </Text>
              )}
              <Text style={styles.itemQty}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  householdName: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  quickBtnIcon: { fontSize: 22 },
  quickBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardLink: { fontSize: 13, color: Colors.accent, fontWeight: '500' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.separator,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', minWidth: 28 },

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
  itemName: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  itemStorage: { fontSize: 12, color: Colors.textSecondary, marginRight: 4 },
  itemQty: { fontSize: 13, color: Colors.textSecondary },

  emptyText: { fontSize: 14, color: Colors.textSecondary, paddingVertical: 8 },
  allDoneText: { fontSize: 14, color: Colors.accent, fontWeight: '600', paddingVertical: 8 },
  moreText: { fontSize: 13, color: Colors.accent, marginTop: 6, fontWeight: '500' },
});
