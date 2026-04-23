import React, { useEffect, useState } from 'react';
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
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/AppTabs';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const CARD_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA'];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  useEffect(() => {
    if (!selectedHouseholdId && households && households.length > 0) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);


  const household = households?.find((h) => h.id === effectiveId);
  const { data: fridgeItems, isLoading: fridgeLoading } = useFridge(effectiveId);
  const { data: shoppingLists, isLoading: listsLoading } = useShoppingLists(effectiveId);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'voce';
  const urgentLists = (shoppingLists ?? []).filter((l) => l.urgent);

  const now = new Date();
  const expiringFridge = (fridgeItems ?? [])
    .filter((item) => {
      if (!item.expirationDate) return false;
      const diff = (new Date(item.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 3;
    })
    .sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
    .slice(0, 5);

  function goToListaTab() {
    navigation.getParent()?.navigate('ListaTab' as never);
  }

  function goToGeladeirTab() {
    navigation.getParent()?.navigate('GeladeirTab' as never);
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => setDropdownOpen(false)}
    >
      {dropdownOpen && (
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        />
      )}
      <View style={styles.header}>
        <Text style={styles.greeting}>Ola, {firstName}! 👋</Text>

        {household && (
          <View style={styles.householdWrapper}>
            <TouchableOpacity
              style={styles.householdRow}
              activeOpacity={(households?.length ?? 0) > 1 ? 0.6 : 1}
              onPress={() => {
                if ((households?.length ?? 0) <= 1) return;
                setDropdownOpen((o) => !o);
              }}
            >
              <Text style={styles.householdName}>🏠 {household.name}</Text>
              {(households?.length ?? 0) > 1 && (
                <Text style={styles.householdChevron}>{dropdownOpen ? '▴' : '▾'}</Text>
              )}
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.householdDropdown}>
                {(households ?? []).map((h, i) => {
                  const color = CARD_COLORS[i % CARD_COLORS.length];
                  return (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.householdOption, { borderLeftColor: color, borderLeftWidth: 3 }, h.id === effectiveId && styles.householdOptionActive]}
                    onPress={() => { setSelectedHouseholdId(h.id); setDropdownOpen(false); }}
                  >
                    <Text style={[styles.householdOptionText, h.id === effectiveId && styles.householdOptionTextActive]}>
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {household && (
          <Text style={styles.householdMeta}>
            {fridgeItems?.length ?? 0} itens na geladeira
            {'  ·  '}
            {shoppingLists?.length ?? 0} {shoppingLists?.length === 1 ? 'lista' : 'listas'} pendente{shoppingLists?.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

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
          onPress={() => effectiveId && navigation.navigate('HomeCreateShoppingList', { householdId: effectiveId })}
          disabled={!effectiveId}
        >
          <Text style={styles.quickBtnIcon}>🛒</Text>
          <Text style={styles.quickBtnText}>+ Lista</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>🚨</Text>
            <Text style={styles.cardTitle}>Urgente</Text>
          </View>
          <TouchableOpacity onPress={goToListaTab}>
            <Text style={styles.cardLink}>Ver lista →</Text>
          </TouchableOpacity>
        </View>

        {listsLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : urgentLists.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma lista urgente.</Text>
        ) : (
          urgentLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={styles.itemRow}
              onPress={() =>
                navigation.navigate('HomeShoppingListDetail', {
                  householdId: effectiveId!,
                  listId: list.id,
                  listName: list.name,
                  listUrgent: list.urgent,
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.itemDot, { backgroundColor: '#F0A500' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{list.name}</Text>
                <Text style={styles.itemStorage}>🛒 Lista de compras</Text>
              </View>
              {list.itemCount > 0 && <Text style={styles.itemQty}>{list.itemCount} itens</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>⚠️</Text>
            <Text style={styles.cardTitle}>Vencendo</Text>
          </View>
          <TouchableOpacity onPress={goToGeladeirTab}>
            <Text style={styles.cardLink}>Ver geladeira →</Text>
          </TouchableOpacity>
        </View>

        {fridgeLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : expiringFridge.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum item proximo do vencimento.</Text>
        ) : (
          expiringFridge.map((item) => {
            const diff = Math.ceil(
              (new Date(item.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            const expired = diff < 0;
            const dotColor = expired ? '#EF4444' : diff === 0 ? '#F97316' : '#F0A500';
            const label = expired ? `Vencido ha ${Math.abs(diff)}d` : diff === 0 ? 'Vence hoje' : `Vence em ${diff}d`;

            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={[styles.itemDot, { backgroundColor: dotColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.storage && (
                    <Text style={styles.itemStorage}>
                      {item.storage.emoji} {item.storage.name}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemQty, { color: dotColor }]}>{label}</Text>
              </View>
            );
          })
        )}
      </View>

    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 2,
    marginTop: 6,
    backgroundColor: Colors.accent + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  householdName: { fontSize: 14, fontWeight: '600', color: Colors.accent },
  householdChevron: { fontSize: 12, color: Colors.accent, marginTop: 1 },
  householdMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 0 },
  dropdownBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  householdWrapper: { alignSelf: 'flex-start', zIndex: 999 },
  householdDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
  householdOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  householdOptionActive: { backgroundColor: Colors.accent + '15' },
  householdOptionText: { fontSize: 14, color: Colors.textPrimary },
  householdOptionTextActive: { color: Colors.accent, fontWeight: '600' },

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
    minHeight: 24,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  cardTitleIcon: { fontSize: 16, lineHeight: 20 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: Colors.textPrimary },
  cardLink: { fontSize: 13, color: Colors.accent, fontWeight: '500' },

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
  itemStorage: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemQty: { fontSize: 13, color: Colors.textSecondary },

  emptyText: { fontSize: 14, color: Colors.textSecondary, paddingVertical: 8 },
});
