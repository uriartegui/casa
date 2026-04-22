import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useFridge } from '../../hooks/useFridge';
import { useShoppingActivity, useShoppingLists } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/AppTabs';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

type RecentActivityEntry = {
  id: string;
  actor: string;
  text: string;
  time: string;
  color: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);
  const effectiveId = selectedHouseholdId ?? households?.[0]?.id ?? null;

  useEffect(() => {
    if (!selectedHouseholdId && households && households.length > 0) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId, setSelectedHouseholdId]);

  const household = households?.find((h) => h.id === effectiveId);
  const { data: fridgeItems, isLoading: fridgeLoading } = useFridge(effectiveId);
  const { data: shoppingLists, isLoading: listsLoading } = useShoppingLists(effectiveId);
  const { data: activity } = useShoppingActivity(effectiveId);

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

  function storagePreposition(name?: string | null) {
    if (!name) return 'na geladeira';
    const normalized = name.trim().toLowerCase();
    if (normalized.startsWith('freezer')) return `no ${name}`;
    if (normalized.startsWith('frigobar')) return `no ${name}`;
    return `na ${name}`;
  }

  const recentActivity: RecentActivityEntry[] = [
    ...(activity ?? []).map((event) => ({
      id: `shopping-${event.id}`,
      actor: event.createdBy?.name?.split(' ')[0] ?? 'Alguem',
      text:
        event.type === 'sent_to_fridge'
          ? `mandou ${event.name} para geladeira: ${event.listName}`
          : `adicionou ${event.name} na lista: ${event.listName}`,
      time: event.createdAt,
      color: event.type === 'sent_to_fridge' ? '#22C55E' : '#F0A500',
    })),
    ...(fridgeItems ?? []).map((item) => ({
      id: `fridge-${item.id}`,
      actor: item.createdBy?.name?.split(' ')[0] ?? 'Alguem',
      text: item.storage?.name
        ? `adicionou ${item.name} ${storagePreposition(item.storage.name)}`
        : `adicionou ${item.name} na geladeira`,
      time: item.createdAt,
      color: '#2D7FF9',
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 4);

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
      <View style={styles.header}>
        <Text style={styles.greeting}>Ola, {firstName}! 👋</Text>
        {household && (
          <View style={styles.householdBlock}>
            <TouchableOpacity
              ref={triggerRef}
              onPress={() => {
                triggerRef.current?.measureInWindow((x, y, _w, h) => {
                  setPickerAnchor({ x, y: y + h + 4 });
                  setShowPicker(true);
                });
              }}
              activeOpacity={0.7}
              style={styles.householdRow}
            >
              <Text style={styles.householdName}>🏠 {household.name}</Text>
              {households && households.length > 1 && (
                <Ionicons name="chevron-down" size={13} color={Colors.accent} />
              )}
            </TouchableOpacity>
            <Text style={styles.householdMeta}>
              {fridgeItems?.length ?? 0} itens na geladeira • {shoppingLists?.length ?? 0}{' '}
              {(shoppingLists?.length ?? 0) === 1 ? 'lista aberta' : 'listas abertas'}
            </Text>
          </View>
        )}

        {households && households.length > 1 && (
          <Modal
            visible={showPicker}
            transparent
            animationType="none"
            onRequestClose={() => setShowPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            >
              <View style={[styles.householdDropdown, { top: pickerAnchor.y, left: pickerAnchor.x }]}>
                {households.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.householdOption, h.id === effectiveId && styles.householdOptionActive]}
                    onPress={() => {
                      setSelectedHouseholdId(h.id);
                      setShowPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.householdOptionText,
                        h.id === effectiveId && styles.householdOptionTextActive,
                      ]}
                    >
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
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

      {recentActivity.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Atividade recente</Text>
            <View />
          </View>
          {recentActivity.map((entry) => (
            <View key={entry.id} style={styles.activityRow}>
              <View style={[styles.activityDot, { backgroundColor: entry.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText} numberOfLines={1}>
                  <Text style={styles.activityActor}>{entry.actor} </Text>
                  <Text style={styles.activityItem}>{entry.text}</Text>
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(entry.time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  {' · '}
                  {new Date(entry.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  householdBlock: { marginTop: 4 },
  householdRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, alignSelf: 'flex-start' },
  householdName: { fontSize: 14, color: Colors.textSecondary },
  householdMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  modalBackdrop: { flex: 1 },
  householdDropdown: {
    position: 'absolute',
    minWidth: 150,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  householdOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  householdOptionActive: { backgroundColor: Colors.accent + '18' },
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

  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    gap: 10,
  },
  activityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },
  activityText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  activityActor: { fontWeight: '600' },
  activityItem: { color: Colors.textPrimary },
  activityTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
});
