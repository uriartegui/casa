import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHouseholds, usePromoteToAdmin, useRemoveMember } from '../../hooks/useHouseholds';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'MemberDetail'>;
  route: RouteProp<HouseholdStackParamList, 'MemberDetail'>;
};

export default function MemberDetailScreen({ navigation, route }: Props) {
  const { householdId, memberId } = route.params;
  const { data: households, isLoading } = useHouseholds();
  const { user } = useAuth();
  const { showToast } = useToast();
  const promoteToAdmin = usePromoteToAdmin();
  const removeMember = useRemoveMember();

  const household = households?.find((h) => h.id === householdId);
  const member = household?.members?.find((m) => m.id === memberId);
  const myMember = household?.members?.find((m) => m.userId === user?.id);
  const isAdmin = myMember?.role === 'admin';
  const isMe = member?.userId === user?.id;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Membro não encontrado.</Text>
      </View>
    );
  }

  const joinedDate = new Date(member.joinedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  function handlePromote() {
    Alert.alert(
      `Tornar ${member!.user?.name ?? 'este membro'} admin?`,
      'Admins podem convidar pessoas, tornar outros membros admins e excluir a casa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tornar admin',
          onPress: async () => {
            try {
              await promoteToAdmin.mutateAsync({ householdId, memberId });
              showToast(`${member!.user?.name ?? 'Membro'} agora é admin`);
              navigation.goBack();
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? 'Não foi possível promover o membro.';
              showToast(String(msg), 'error');
            }
          },
        },
      ],
    );
  }

  function handleRemove() {
    Alert.alert(
      `Remover ${member!.user?.name ?? 'este membro'}?`,
      'O membro perderá acesso à casa e a todos os itens.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync({ householdId, memberId });
              showToast(`${member!.user?.name ?? 'Membro'} removido da casa`);
              navigation.goBack();
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? 'Não foi possível remover o membro.';
              showToast(String(msg), 'error');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(member.user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{member.user?.name ?? 'Membro'}{isMe ? ' (você)' : ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={[styles.roleText, member.role === 'admin' && styles.roleAdmin]}>
            {member.role === 'admin' ? 'Admin' : 'Membro'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{member.user?.email ?? '—'}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Entrou em</Text>
          <Text style={styles.infoValue}>{joinedDate}</Text>
        </View>
      </View>

      {isAdmin && !isMe && member.role !== 'admin' && (
        <TouchableOpacity style={styles.promoteButton} onPress={handlePromote} disabled={promoteToAdmin.isPending}>
          {promoteToAdmin.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.promoteButtonText}>Tornar admin</Text>
          }
        </TouchableOpacity>
      )}

      {isAdmin && !isMe && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemove} disabled={removeMember.isPending}>
          {removeMember.isPending
            ? <ActivityIndicator color={Colors.destructive} />
            : <Text style={styles.removeButtonText}>Remover da casa</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.separator,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  roleBadge: {
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.separator,
  },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  roleAdmin: { color: Colors.accent },
  infoCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.separator,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel: { fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  separator: { height: 1, backgroundColor: Colors.separator, marginHorizontal: 14 },
  promoteButton: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center' },
  promoteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  removeButton: { borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive },
  removeButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
});
