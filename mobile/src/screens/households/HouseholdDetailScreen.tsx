import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { HouseholdMember } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdDetail'>;
  route: RouteProp<HouseholdStackParamList, 'HouseholdDetail'>;
};

export default function HouseholdDetailScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: households, isLoading } = useHouseholds();
  const { setSelectedHouseholdId } = useSelectedHousehold();

  const household = households?.find((h) => h.id === householdId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!household) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Casa não encontrada.</Text>
      </View>
    );
  }

  function handleOpenFridge() {
    setSelectedHouseholdId(householdId);
    navigation.getParent()?.navigate('GeladeirTab');
  }

  function renderMember({ item }: { item: HouseholdMember }) {
    return (
      <View style={styles.memberRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.memberName}>{item.user?.name ?? 'Membro'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={household.members ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.sectionLabel}>MEMBROS</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum membro ainda.</Text>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleOpenFridge}>
          <Text style={styles.buttonText}>Ver geladeira</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate('Invite', { householdId })}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Convidar pessoa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  list: { padding: 16, gap: 2 },
  header: { marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  memberName: { fontSize: 16, color: Colors.textPrimary },
  emptyText: { color: Colors.textSecondary, fontSize: 15, paddingTop: 8 },
  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: Colors.accent },
});
