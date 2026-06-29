import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import HouseTasksScreen from '../../screens/households/HouseTasksScreen';
import { stackScreenOptions } from '../stackOptions';

const TasksStack = createNativeStackNavigator();

function TasksEntryScreen({ navigation, route, initialCategory }: any) {
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const household = households?.find((h) => h.id === effectiveId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Carregando...</Text>
      </View>
    );
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.mutedText}>Crie ou entre em uma casa primeiro.</Text>
      </View>
    );
  }

  return (
    <HouseTasksScreen
      navigation={navigation}
      route={{
        key: 'TasksEntry',
        name: 'HouseTasks',
        params: {
          householdId: effectiveId,
          householdName: household?.name ?? 'Casa',
          initialCategory,
          highlightTaskId: route?.params?.highlightTaskId,
        },
      } as any}
    />
  );
}

function TaskCategoryScreen({ navigation, route }: any) {
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const household = households?.find((h) => h.id === effectiveId);

  if (isLoading || !effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>{isLoading ? 'Carregando...' : 'Nenhuma casa selecionada'}</Text>
      </View>
    );
  }

  return (
    <HouseTasksScreen
      key={`task-category-${route.params.category}`}
      navigation={navigation}
      route={{
        key: `TaskCategory-${route.params.category}`,
        name: 'HouseTasks',
        params: {
          householdId: effectiveId,
          householdName: household?.name ?? 'Casa',
          initialCategory: route.params.category,
          highlightTaskId: route.params.highlightTaskId,
        },
      } as any}
    />
  );
}

export default function TasksNavigator() {
  return (
    <TasksStack.Navigator screenOptions={stackScreenOptions}>
      <TasksStack.Screen name="TasksEntry" options={{ title: 'Tarefas' }}>
        {(props) => <TasksEntryScreen {...props} />}
      </TasksStack.Screen>
      <TasksStack.Screen name="TaskCategory" component={TaskCategoryScreen} options={({ route }: any) => ({ title: route.params.category, headerBackVisible: false })} />
    </TasksStack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  mutedText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
