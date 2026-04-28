import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHouseholds, useDeleteHousehold, useLeaveHousehold } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();
  const deleteHousehold = useDeleteHousehold();
  const leaveHousehold = useLeaveHousehold();

  const household = households?.find((h) => h.id === householdId);
  const myMember = household?.members?.find((m) => m.userId === user?.id);
  const isAdmin = myMember?.role === 'admin';

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

  function handleDelete() {
    Alert.alert(
      `Excluir "${household!.name}"?`,
      'Isso vai apagar todos os itens, membros e dados da casa. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHousehold.mutateAsync(householdId);
              setSelectedHouseholdId(null);
              navigation.popToTop();
              navigation.getParent()?.navigate('ColmeiaTab' as never);
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? 'Não foi possível excluir a casa.';
              Alert.alert('Erro', String(msg));
            }
          },
        },
      ],
    );
  }

  function handleLeave() {
    Alert.alert(
      'Sair da casa?',
      'Você perderá acesso a esta casa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHousehold.mutateAsync(householdId);
              setSelectedHouseholdId(null);
              navigation.getParent()?.navigate('ColmeiaTab' as never);
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? 'Não foi possível sair da casa.';
              Alert.alert('Erro', String(msg));
            }
          },
        },
      ],
    );
  }

  function renderMember({ item }: { item: HouseholdMember }) {
    const isMe = item.userId === user?.id;
    return (
      <TouchableOpacity
        style={styles.memberRow}
        onPress={() => navigation.navigate('MemberDetail', { householdId, memberId: item.id })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.user?.name ?? 'Membro'}{isMe ? ' (você)' : ''}
          </Text>
          {item.role === 'admin' && (
            <Text style={styles.roleAdmin}>Admin</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
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
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate('Invite', { householdId })}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Convidar pessoa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate('ManageCategories', { householdId, householdName: household.name })}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Gerenciar categorias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} disabled={leaveHousehold.isPending}>
          {leaveHousehold.isPending
            ? <ActivityIndicator color={Colors.destructive} />
            : <Text style={styles.leaveButtonText}>Sair da casa</Text>
          }
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleteHousehold.isPending}>
            {deleteHousehold.isPending
              ? <ActivityIndicator color={Colors.destructive} />
              : <Text style={styles.deleteButtonText}>Excluir casa</Text>
            }
          </TouchableOpacity>
        )}
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
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, color: Colors.textPrimary },
  roleAdmin: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginTop: 1 },
  chevron: { fontSize: 20, color: Colors.textSecondary },
  emptyText: { color: Colors.textSecondary, fontSize: 15, paddingTop: 8 },
  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: Colors.accent },
  leaveButton: { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive },
  leaveButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
  deleteButton: { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive },
  deleteButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
});
