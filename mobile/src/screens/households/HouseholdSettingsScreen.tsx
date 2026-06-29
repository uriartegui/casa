import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useDeleteHousehold, useHouseholds, useLeaveHousehold } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdSettings'>;
  route: RouteProp<HouseholdStackParamList, 'HouseholdSettings'>;
};

export default function HouseholdSettingsScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: households, isLoading } = useHouseholds();
  const { user } = useAuth();
  const { setSelectedHouseholdId } = useSelectedHousehold();
  const deleteHousehold = useDeleteHousehold();
  const leaveHousehold = useLeaveHousehold();
  const household = households?.find((item) => item.id === householdId);
  const isAdmin = household?.members?.some((member) => member.userId === user?.id && member.role === 'admin') ?? false;
  const householdName = household?.name ?? '';

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  if (!household) return <View style={styles.center}><Text style={styles.message}>Casa não encontrada.</Text></View>;

  function handleLeave() {
    Alert.alert('Sair da casa?', 'Você perderá acesso aos estoques, listas e tarefas desta casa.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveHousehold.mutateAsync(householdId);
            setSelectedHouseholdId(null);
            navigation.popToTop();
          } catch (error: any) {
            Alert.alert('Erro', String(error?.response?.data?.message ?? 'Não foi possível sair da casa.'));
          }
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(`Excluir "${householdName}"?`, 'Todos os dados desta casa serão apagados definitivamente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir casa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHousehold.mutateAsync(householdId);
            setSelectedHouseholdId(null);
            navigation.popToTop();
          } catch (error: any) {
            Alert.alert('Erro', String(error?.response?.data?.message ?? 'Não foi possível excluir a casa.'));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>ZONA DE PERIGO</Text>
        <Text style={styles.description}>Estas ações afetam seu acesso ou todos os dados de {householdName}.</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLeave} disabled={leaveHousehold.isPending}>
          {leaveHousehold.isPending ? <ActivityIndicator color={Colors.destructive} /> : <Text style={styles.dangerText}>Sair da casa</Text>}
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.dangerButton} onPress={handleDelete} disabled={deleteHousehold.isPending}>
            {deleteHousehold.isPending ? <ActivityIndicator color={Colors.destructive} /> : <Text style={styles.dangerText}>Excluir casa</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  content: { padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.destructive, letterSpacing: 0.5, marginBottom: 8 },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  dangerButton: { minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: Colors.destructive, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dangerText: { color: Colors.destructive, fontSize: 16, fontWeight: '700' },
  message: { color: Colors.textSecondary, fontSize: 15 },
});
