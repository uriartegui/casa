import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { HouseholdMember } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdMembers'>;
  route: RouteProp<HouseholdStackParamList, 'HouseholdMembers'>;
};

export default function HouseholdMembersScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: households, isLoading } = useHouseholds();
  const { user } = useAuth();
  const household = households?.find((item) => item.id === householdId);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  if (!household) {
    return <View style={styles.center}><Text style={styles.emptyText}>Casa não encontrada.</Text></View>;
  }

  function renderMember({ item }: { item: HouseholdMember }) {
    const isMe = item.userId === user?.id;
    return (
      <TouchableOpacity
        style={styles.memberRow}
        activeOpacity={0.72}
        onPress={() => navigation.navigate('MemberDetail', { householdId, memberId: item.id })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.user?.name ?? 'Membro'}{isMe ? ' (você)' : ''}</Text>
          <Text style={styles.memberRole}>{item.role === 'admin' ? 'Admin' : 'Membro'}</Text>
        </View>
        <Feather name="chevron-right" size={19} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={household.members ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionLabel}>PESSOAS DA CASA</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma pessoa nesta casa.</Text>}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.inviteButton} onPress={() => navigation.navigate('Invite', { householdId })}>
          <Feather name="user-plus" size={18} color="#fff" />
          <Text style={styles.inviteText}>Convidar pessoa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  list: { padding: 16, gap: 2, flexGrow: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  memberInfo: { flex: 1 },
  memberName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  memberRole: { color: Colors.accent, fontSize: 13, fontWeight: '600', marginTop: 2 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', paddingTop: 20 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  inviteButton: { minHeight: 50, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  inviteText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
