import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import {
  useCreateHouseTask,
  useDeleteHouseTask,
  useHouseTaskActivity,
  useHouseTasks,
  useUpdateHouseTaskStatus,
} from '../../hooks/useHouseTasks';
import { HouseTask } from '../../types';
import { formatBrShortDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseTasks'>;
  route: RouteProp<HouseholdStackParamList, 'HouseTasks'>;
};

type StatusFilter = 'open' | 'mine' | 'late' | 'done' | 'all';

const CATEGORIES = ['Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutencao', 'Compras', 'Organizacao', 'Outros'];
const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendentes', value: 'open' },
  { label: 'Minhas', value: 'mine' },
  { label: 'Atrasadas', value: 'late' },
  { label: 'Concluidas', value: 'done' },
  { label: 'Tudo', value: 'all' },
];

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

function isLate(task: HouseTask) {
  return !!task.dueDate && task.dueDate < dateKeyFromOffset(0) && !task.done;
}

function TaskHouseholdHeader({ category, householdName }: { category: string; householdName: string }) {
  const { data: households } = useHouseholds();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const [open, setOpen] = useState(false);
  const activeHouseholdName = households?.find((household) => household.id === selectedHouseholdId)?.name ?? householdName;

  return (
    <View style={{ position: 'relative', minWidth: 150 }}>
      <TouchableOpacity onPress={() => setOpen((value) => !value)} activeOpacity={0.75} style={{ paddingVertical: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textPrimary, lineHeight: 20 }}>{category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, lineHeight: 14 }}>{activeHouseholdName}</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={13} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {open && <View style={{ position: 'absolute', top: 40, left: -6, minWidth: 180, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator, borderRadius: 8, zIndex: 20, elevation: 8, overflow: 'hidden' }}>
        {(households ?? []).map((household) => <TouchableOpacity key={household.id} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: household.id === selectedHouseholdId ? Colors.accent + '12' : Colors.card }} onPress={() => { setSelectedHouseholdId(household.id); setOpen(false); }}><Text style={{ fontSize: 13, fontWeight: household.id === selectedHouseholdId ? '800' : '500', color: household.id === selectedHouseholdId ? Colors.accent : Colors.textPrimary }}>{household.name}</Text></TouchableOpacity>)}
      </View>}
    </View>
  );
}

export default function HouseTasksScreen({ navigation, route }: Props) {
  const { householdId, householdName, initialCategory } = route.params;
  const isCategoryPage = !!initialCategory;
  const { user } = useAuth();
  const { data: households } = useHouseholds();
  const { data: tasks, isLoading, refetch } = useHouseTasks(householdId);
  const { data: activity = [] } = useHouseTaskActivity(householdId);
  const createTask = useCreateHouseTask(householdId);
  const updateStatus = useUpdateHouseTaskStatus(householdId);
  const deleteTask = useDeleteHouseTask(householdId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>('Limpeza');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'unassigned' | 'all' | 'user'>('unassigned');
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<HouseTask['recurrence']>('none');
  const [reminder, setReminder] = useState<HouseTask['reminder']>('none');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const members = households?.find((item) => item.id === householdId)?.members ?? [];

  React.useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
      setCategory(initialCategory);
      setShowCategoryFilters(true);
    }
  }, [initialCategory]);

  React.useEffect(() => {
    navigation.setOptions({
      title: initialCategory ?? 'Tarefas da casa',
      headerTitle: initialCategory ? () => <TaskHouseholdHeader category={initialCategory} householdName={householdName} /> : undefined,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={() => navigation.getParent()?.navigate('Menu' as never)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="menu" size={30} color={Colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const stats = useMemo(() => {
    const all = tasks ?? [];
    const pending = all.filter((task) => !task.done).length;
    const late = all.filter(isLate).length;
    const done = all.filter((task) => task.done).length;
    return { pending, late, done, total: all.length };
  }, [tasks]);

  const categoryOptions = useMemo(() => {
    const fromTasks = (tasks ?? []).map((task) => task.category).filter(Boolean) as string[];
    return ['Todas', ...Array.from(new Set([...CATEGORIES, ...fromTasks]))];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return (tasks ?? []).filter((task) => {
      if (isCategoryPage && task.category !== initialCategory) return false;
      if (statusFilter === 'open' && task.done) return false;
      if (statusFilter === 'done' && !task.done) return false;
      if (statusFilter === 'late' && !isLate(task)) return false;
      if (statusFilter === 'mine' && task.assignedToId !== user?.id) return false;
      if (categoryFilter !== 'Todas' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, initialCategory, isCategoryPage, statusFilter, tasks, user?.id]);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({ title: trimmed, description: description.trim() || null, category: initialCategory ?? category, dueDate, assignmentType, assignedToId, recurrence, reminder });
    setTitle('');
    setDescription('');
    setDueDate(null);
    setCategory('Limpeza');
    setAssignmentType('unassigned');
    setAssignedToId(null);
    setRecurrence('none');
    setReminder('none');
    setSheetVisible(false);
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
    const late = isLate(item);

    return (
      <TouchableOpacity
        style={[styles.taskCard, item.done && styles.taskCardDone, late && styles.taskCardLate]}
        activeOpacity={0.75}
        onPress={() => updateStatus.mutate({ taskId: item.id, done: !item.done })}
      >
        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
          {item.done && <Feather name="check" size={15} color="#fff" />}
        </View>

        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {item.category && <Text style={styles.metaText}>{item.category}</Text>}
            {label && <Text style={[styles.metaText, late && styles.metaTextLate]}>{label}</Text>}
            <Text style={styles.metaText}>{item.assignmentType === 'all' ? 'Todos' : item.assignedTo?.name ? item.assignedTo.name.split(' ')[0] : 'Sem responsavel'}</Text>
            {item.recurrence !== 'none' && <Text style={styles.metaText}>{item.recurrence === 'weekly' ? 'Toda semana' : item.recurrence === 'daily' ? 'Todo dia' : item.recurrence === 'monthly' ? 'Todo mes' : 'Recorrente'}</Text>}
            {item.done && item.completedBy?.name && (
              <Text style={styles.metaText}>por {item.completedBy.name.split(' ')[0]}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderKanbanColumn(title: string, status: 'pending' | 'in_progress' | 'completed') {
    const items = visibleTasks.filter((task) => (status === 'completed' ? task.done : task.status === status && !task.done));
    return <View key={status} style={styles.kanbanColumn}>
      <Text style={styles.kanbanTitle}>{title} ({items.length})</Text>
      {items.map((task) => <TouchableOpacity key={task.id} style={styles.kanbanCard} onPress={() => updateStatus.mutate({ taskId: task.id, status: status === 'pending' ? 'in_progress' : status === 'in_progress' ? 'completed' : 'pending' })}>
        <Text style={styles.kanbanCardTitle}>{task.title}</Text>
        <Text style={styles.kanbanCardMeta}>{task.assignedTo?.name?.split(' ')[0] ?? (task.assignmentType === 'all' ? 'Todos' : 'Sem responsavel')}</Text>
      </TouchableOpacity>)}
      {items.length === 0 && <Text style={styles.kanbanEmpty}>Nenhuma tarefa</Text>}
    </View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={viewMode === 'list' ? visibleTasks : []}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={[styles.list, viewMode === 'list' && visibleTasks.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={
          <View>
            {!isCategoryPage && <View style={styles.compactSummary}>
              <View>
                <Text style={styles.householdLabel}>{householdName}</Text>
                <Text style={styles.compactTitle}>Tarefas</Text>
              </View>
              <Text style={styles.compactStats}>{stats.pending} pendentes  {stats.late > 0 ? `· ${stats.late} atrasadas` : ''}</Text>
            </View>}

            {!isCategoryPage && <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow} style={styles.statusScroll}>
              {STATUS_FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
                  onPress={() => setStatusFilter(item.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
              <TouchableOpacity style={[styles.categoryFilterButton, categoryFilter !== 'Todas' && styles.categoryFilterButtonActive]} onPress={() => setShowCategoryFilters((value) => !value)}>
                <Feather name="sliders" size={15} color={categoryFilter !== 'Todas' ? '#fff' : Colors.accent} />
              </TouchableOpacity>
            </View>}
            {!isCategoryPage && showCategoryFilters && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRowSecondary}>
              {categoryOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.categoryChip, categoryFilter === item && styles.categoryChipActive]}
                  onPress={() => setCategoryFilter(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryChipText, categoryFilter === item && styles.categoryChipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>}
            {isCategoryPage && <Text style={styles.categoryContextText}>{stats.pending} {stats.pending === 1 ? 'tarefa pendente' : 'tarefas pendentes'} nesta categoria</Text>}
            <View style={styles.viewSwitch}><TouchableOpacity style={[styles.viewSwitchOption, viewMode === 'list' && styles.viewSwitchOptionActive]} onPress={() => setViewMode('list')}><Text style={[styles.viewSwitchText, viewMode === 'list' && styles.viewSwitchTextActive]}>Lista</Text></TouchableOpacity><TouchableOpacity style={[styles.viewSwitchOption, viewMode === 'kanban' && styles.viewSwitchOptionActive]} onPress={() => setViewMode('kanban')}><Text style={[styles.viewSwitchText, viewMode === 'kanban' && styles.viewSwitchTextActive]}>Kanban</Text></TouchableOpacity></View>
            {viewMode === 'kanban' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanbanBoard}>{renderKanbanColumn('A fazer', 'pending')}{renderKanbanColumn('Em andamento', 'in_progress')}{renderKanbanColumn('Concluidas', 'completed')}</ScrollView>}
          </View>
        }
        ListEmptyComponent={viewMode === 'list' ? (
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nada por aqui</Text>
              <Text style={styles.emptySubtitle}>Crie tarefas como lavar toalhas, trocar filtro ou comprar gas.</Text>
            </View>
          ) : (
            <ActivityIndicator color={Colors.accent} />
          )
        ) : null}
        ListFooterComponent={activity.length > 0 ? (
          <View style={styles.activityPreview}>
            <Text style={styles.activityTitle}>Atividade recente</Text>
            {activity.slice(0, 3).map((event) => (
              <Text key={event.id} style={styles.activityText}>
                {event.userName} {event.action === 'completed' ? 'concluiu' : event.action === 'created' ? 'criou' : event.action === 'overdue' ? 'tem atraso em' : 'atualizou'} {event.taskTitle}
              </Text>
            ))}
          </View>
        ) : null}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => setSheetVisible(true)} activeOpacity={0.8}>
          <Text style={styles.buttonText}>+ Nova tarefa</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSheetVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Nova tarefa</Text>

              <Text style={styles.sheetLabel}>Tarefa</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: lavar toalhas"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />

              <Text style={styles.sheetLabel}>Descricao (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Detalhes para quem vai fazer"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, styles.descriptionInput]}
                multiline
              />

              {!isCategoryPage && <><Text style={styles.sheetLabel}>Categoria</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, category === item && styles.chipActive]}
                    onPress={() => setCategory(category === item ? null : item)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View></>}

              <Text style={styles.sheetLabel}>Responsavel</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                <TouchableOpacity style={[styles.chip, assignmentType === 'unassigned' && styles.chipActive]} onPress={() => { setAssignmentType('unassigned'); setAssignedToId(null); }}><Text style={[styles.chipText, assignmentType === 'unassigned' && styles.chipTextActive]}>Sem responsavel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, assignmentType === 'all' && styles.chipActive]} onPress={() => { setAssignmentType('all'); setAssignedToId(null); }}><Text style={[styles.chipText, assignmentType === 'all' && styles.chipTextActive]}>Todos</Text></TouchableOpacity>
                {members.map((member) => <TouchableOpacity key={member.userId} style={[styles.chip, assignmentType === 'user' && assignedToId === member.userId && styles.chipActive]} onPress={() => { setAssignmentType('user'); setAssignedToId(member.userId); }}><Text style={[styles.chipText, assignmentType === 'user' && assignedToId === member.userId && styles.chipTextActive]}>{member.user?.name?.split(' ')[0] ?? 'Membro'}</Text></TouchableOpacity>)}
              </ScrollView>

              <Text style={styles.sheetLabel}>Repeticao</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {(['none', 'daily', 'weekly', 'biweekly', 'monthly'] as const).map((item) => <TouchableOpacity key={item} style={[styles.chip, recurrence === item && styles.chipActive]} onPress={() => setRecurrence(item)}><Text style={[styles.chipText, recurrence === item && styles.chipTextActive]}>{item === 'none' ? 'Nao repetir' : item === 'daily' ? 'Todo dia' : item === 'weekly' ? 'Toda semana' : item === 'biweekly' ? '15 dias' : 'Todo mes'}</Text></TouchableOpacity>)}
              </ScrollView>

              <Text style={styles.sheetLabel}>Lembrete</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {(['none', 'due', 'one_day_before'] as const).map((item) => <TouchableOpacity key={item} style={[styles.chip, reminder === item && styles.chipActive]} onPress={() => setReminder(item)}><Text style={[styles.chipText, reminder === item && styles.chipTextActive]}>{item === 'none' ? 'Sem lembrete' : item === 'due' ? 'No prazo' : '1 dia antes'}</Text></TouchableOpacity>)}
              </ScrollView>

              <Text style={styles.sheetLabel}>Prazo</Text>
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
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, dueDate === item.value && styles.chipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, !title.trim() && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={!title.trim() || createTask.isPending}
                activeOpacity={0.8}
              >
                {createTask.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Adicionar tarefa</Text>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerMenuButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 104 },
  listEmpty: { flexGrow: 1 },
  summary: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    marginBottom: 12,
  },
  compactSummary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 },
  compactTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  compactStats: { fontSize: 12, color: Colors.textSecondary, paddingBottom: 2 },
  categoryContextText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  viewSwitch: { flexDirection: 'row', alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.separator, borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  viewSwitchOption: { paddingHorizontal: 14, paddingVertical: 7 },
  viewSwitchOptionActive: { backgroundColor: Colors.accent },
  viewSwitchText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  viewSwitchTextActive: { color: '#fff' },
  kanbanBoard: { gap: 10, paddingBottom: 14 },
  kanbanColumn: { width: 218, minHeight: 270, backgroundColor: Colors.accent + '0D', borderRadius: 10, padding: 10, gap: 8 },
  kanbanTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  kanbanCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator, borderRadius: 9, padding: 10, gap: 4 },
  kanbanCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  kanbanCardMeta: { fontSize: 11, color: Colors.textSecondary },
  kanbanEmpty: { fontSize: 12, color: Colors.textSecondary, paddingTop: 8 },
  householdLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, marginBottom: 4 },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  summaryText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    backgroundColor: Colors.background,
    padding: 10,
  },
  statValue: { fontSize: 19, fontWeight: '800', color: Colors.textPrimary },
  statValueLate: { color: Colors.destructive },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusScroll: { flex: 1 },
  filtersRow: { gap: 8 },
  filtersRowSecondary: { gap: 8, paddingBottom: 12 },
  categoryFilterButton: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.separator, borderRadius: 17, backgroundColor: Colors.card },
  categoryFilterButtonActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  categoryChip: {
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: Colors.card,
  },
  categoryChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '12' },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  categoryChipTextActive: { color: Colors.accent },
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
  taskCardLate: { borderLeftWidth: 3, borderLeftColor: Colors.destructive },
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
  taskBody: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7, alignItems: 'center' },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  metaTextLate: { color: Colors.destructive, fontWeight: '700' },
  deleteButton: { paddingHorizontal: 2, paddingTop: 1 },
  deleteButtonText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  activityPreview: { borderTopWidth: 1, borderTopColor: Colors.separator, marginTop: 10, paddingTop: 14, gap: 6 },
  activityTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  activityText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 8,
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
  descriptionInput: { minHeight: 68, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horizontalChips: { gap: 8, paddingRight: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
