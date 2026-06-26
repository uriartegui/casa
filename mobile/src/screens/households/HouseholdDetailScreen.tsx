import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseholdDetail'>;
  route: RouteProp<HouseholdStackParamList, 'HouseholdDetail'>;
};

type Shortcut = {
  label: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export default function HouseholdDetailScreen({ navigation, route }: Props) {
  const { householdId, householdName } = route.params;
  const { data: households, isLoading } = useHouseholds();
  const { setSelectedHouseholdId } = useSelectedHousehold();
  const household = households?.find((item) => item.id === householdId);

  useEffect(() => {
    setSelectedHouseholdId(householdId);
  }, [householdId, setSelectedHouseholdId]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  if (!household) return <View style={styles.center}><Text style={styles.message}>Casa não encontrada.</Text></View>;

  const shortcuts: Shortcut[] = [
    {
      label: 'Estoques',
      subtitle: 'Compartimentos da casa',
      icon: 'box',
      onPress: () => navigation.navigate('ManageStorages', { householdId, householdName }),
    },
    {
      label: 'Categorias',
      subtitle: 'Organize seus itens',
      icon: 'tag',
      onPress: () => navigation.navigate('ManageCategories', { householdId, householdName }),
    },
    {
      label: 'Pessoas',
      subtitle: `${household.members?.length ?? 0} ${(household.members?.length ?? 0) === 1 ? 'membro' : 'membros'}`,
      icon: 'users',
      onPress: () => navigation.navigate('HouseholdMembers', { householdId, householdName }),
    },
    {
      label: 'Tarefas',
      subtitle: 'Checklist da casa',
      icon: 'check-square',
      onPress: () => navigation.navigate('HouseTasks', { householdId, householdName }),
    },
    {
      label: 'Convidar',
      subtitle: 'Adicione alguém à casa',
      icon: 'user-plus',
      onPress: () => navigation.navigate('Invite', { householdId }),
    },
    {
      label: 'Configurações',
      subtitle: 'Acesso e dados da casa',
      icon: 'settings',
      onPress: () => navigation.navigate('HouseholdSettings', { householdId, householdName }),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.kicker}>CASA</Text>
          <Text style={styles.title}>{household.name}</Text>
          <Text style={styles.subtitle}>Gerencie pessoas, estoques e organização da casa.</Text>
        </View>
        <View style={styles.grid}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity key={shortcut.label} style={styles.tile} activeOpacity={0.72} onPress={shortcut.onPress}>
              <View style={styles.iconWrap}><Feather name={shortcut.icon} size={23} color={Colors.accent} /></View>
              <Text style={styles.tileTitle}>{shortcut.label}</Text>
              <Text style={styles.tileSubtitle}>{shortcut.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  intro: { marginBottom: 22 },
  kicker: { color: Colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 5 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48.2%', minHeight: 150, borderRadius: 10, borderWidth: 1, borderColor: Colors.separator, backgroundColor: Colors.card, padding: 14, justifyContent: 'space-between' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent + '18', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 16 },
  tileSubtitle: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  message: { color: Colors.textSecondary, fontSize: 15 },
});
