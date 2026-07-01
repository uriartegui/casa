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
import { LoadErrorState } from '../../components/LoadErrorState';
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'MemberDetail'>;
  route: RouteProp<HouseholdStackParamList, 'MemberDetail'>;
};

export default function MemberDetailScreen({ navigation, route }: Props) {
  const { householdId, memberId } = route.params;
  const { data: households, isLoading, isError, isFetching, refetch } = useHouseholds();
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

  if (isError || !households) {
    return (
      <LoadErrorState
        title="Não consegui carregar este membro"
        message="Confira sua conexão e tente novamente."
        isRetrying={isFetching}
        onRetry={() => refetch()}
      />
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
  container: { flex: 1, backgroundColor: Colors.background, padding: 18, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { fontFamily: Typography.body, color: Colors.textSecondary, fontSize: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.separator,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: Typography.title, color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontFamily: Typography.title, fontSize: 21, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  roleBadge: {
    backgroundColor: Colors.background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.separator,
  },
  roleText: { fontFamily: Typography.title, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  roleAdmin: { color: Colors.accent },
  infoCard: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.separator,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, gap: 14 },
  infoLabel: { fontFamily: Typography.body, fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontFamily: Typography.rounded, flexShrink: 1, textAlign: 'right', fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.separator, marginHorizontal: 14 },
  promoteButton: { backgroundColor: Colors.accent, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  promoteButtonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
  removeButton: { borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.destructive },
  removeButtonText: { fontFamily: Typography.title, color: Colors.destructive, fontSize: 16, fontWeight: '700' },
});
