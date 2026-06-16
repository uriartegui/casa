import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import {
  useCreateHouseTask,
  useDeleteHouseTask,
  useHouseTasks,
  useUpdateHouseTaskStatus,
} from '../../hooks/useHouseTasks';
import { HouseTask } from '../../types';
import { formatBrShortDate } from '../../utils/dateUtils';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseTasks'>;
  route: RouteProp<HouseholdStackParamList, 'HouseTasks'>;
};

const CATEGORIES = ['Limpeza', 'Banheiro', 'Lavanderia', 'Manutencao', 'Compras'];

function dateKeyFromOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dueLabel(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const today = dateKeyFromOffset(0);
  const tomorrow = dateKeyFromOffset(1);
  if (dueDate < today) return `Atrasada - ${formatBrShortDate(dueDate)}`;
  if (dueDate === today) return 'Hoje';
  if (dueDate === tomorrow) return 'Amanha';
  return formatBrShortDate(dueDate);
}

export default function HouseTasksScreen({ route }: Props) {
  const { householdId } = route.params;
  const { data: tasks, isLoading, refetch } = useHouseTasks(householdId);
  const createTask = useCreateHouseTask(householdId);
  const updateStatus = useUpdateHouseTaskStatus(householdId);
  const deleteTask = useDeleteHouseTask(householdId);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>('Limpeza');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pendingCount = useMemo(() => (tasks ?? []).filter((task) => !task.done).length, [tasks]);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({ title: trimmed, category, dueDate });
    setTitle('');
    setDueDate(null);
  }

  function handleDelete(task: HouseTask) {
    Alert.alert('Excluir tarefa', `Excluir "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteTask.mutate(task.id),
      },
    ]);
  }

  function renderTask({ item }: { item: HouseTask }) {
    const label = dueLabel(item.dueDate);
    const isLate = !!item.dueDate && item.dueDate < dateKeyFromOffset(0) && !item.done;

    return (
      <TouchableOpacity
        style={[styles.taskCard, item.done && styles.taskCardDone]}
        activeOpacity={0.75}
        onPress={() => updateStatus.mutate({ taskId: item.id, done: !item.done })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
          {item.done && <Text style={styles.checkboxText}>✓</Text>}
        </View>
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>{item.title}</Text>
          <View style={styles.metaRow}>
            {item.category && <Text style={styles.metaChip}>{item.category}</Text>}
            {label && (
              <Text style={[styles.metaChip, isLate && styles.metaChipLate]}>
                {label}
              </Text>
            )}
            {item.done && item.completedBy?.name && (
              <Text style={styles.metaText}>por {item.completedBy.name.split(' ')[0]}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={tasks ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={[styles.list, (!tasks || tasks.length === 0) && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{pendingCount} pendente{pendingCount === 1 ? '' : 's'}</Text>
            <Text style={styles.summaryText}>Limpeza, manutencao e pequenas rotinas da casa.</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma tarefa ainda</Text>
              <Text style={styles.emptySubtitle}>Adicione algo simples: trocar filtro, comprar gas, lavar toalhas...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.composer}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Adicionar tarefa..."
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <View style={styles.chipsRow}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, category === item && styles.chipActive]}
              onPress={() => setCategory(category === item ? null : item)}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chipsRow}>
          {[
            { label: 'Sem data', value: null },
            { label: 'Hoje', value: dateKeyFromOffset(0) },
            { label: 'Amanha', value: dateKeyFromOffset(1) },
            { label: '7 dias', value: dateKeyFromOffset(7) },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.chip, dueDate === item.value && styles.chipActive]}
              onPress={() => setDueDate(item.value)}
            >
              <Text style={[styles.chipText, dueDate === item.value && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.button, !title.trim() && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!title.trim() || createTask.isPending}
        >
          <Text style={styles.buttonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, gap: 10, paddingBottom: 18 },
  listEmpty: { flexGrow: 1 },
  summary: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 14,
    marginBottom: 4,
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summaryText: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 14,
  },
  taskCardDone: { opacity: 0.66 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkboxText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7, alignItems: 'center' },
  metaChip: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipLate: { color: Colors.destructive, borderColor: Colors.destructive },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  composer: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    padding: 14,
    gap: 10,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
