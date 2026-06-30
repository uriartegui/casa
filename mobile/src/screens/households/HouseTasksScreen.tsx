import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Animated,
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { useAuth } from '../../context/AuthContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { DateField, DropdownField } from './components/TaskFields';
import { HelpSheet } from '../../components/HelpSheet';
import AlertsSheet from '../../components/AlertsSheet';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { useTaskAlerts } from './hooks/useTaskAlerts';
import { TASK_HELP_HIGHLIGHTS, TASK_HELP_SECTIONS } from './helpContent';
import { dateFromKey, dateKeyFromPicker, dueLabel, isLate } from './taskDateUtils';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'HouseTasks'>;
  route: RouteProp<HouseholdStackParamList, 'HouseTasks'>;
};

type StatusFilter = 'open' | 'mine' | 'late' | 'done' | 'all';

const NONE_VALUE = '__none__';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CATEGORIES = ['Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutenção', 'Compras', 'Organização', 'Outros'];
const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendentes', value: 'open' },
  { label: 'Minhas', value: 'mine' },
  { label: 'Atrasadas', value: 'late' },
  { label: 'Concluídas', value: 'done' },
  { label: 'Tudo', value: 'all' },
];

function TaskHouseholdHeader({ category, householdName }: { category: string; householdName: string }) {
  const { data: households } = useHouseholds();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const activeHouseholdName = households?.find((household) => household.id === selectedHouseholdId)?.name ?? householdName;

  function selectHousehold(householdId: string) {
    setSelectedHouseholdId(householdId);
  }

  function openHouseholdSelector() {
    const options = households ?? [];
    if (options.length <= 1) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((household) => household.name), 'Cancelar'],
          cancelButtonIndex: options.length,
          userInterfaceStyle: 'light',
        },
        (index) => {
          if (index < options.length) selectHousehold(options[index].id);
        },
      );
      return;
    }

    Alert.alert('Escolher casa', undefined, options.map((household) => ({
      text: household.name,
      onPress: () => selectHousehold(household.id),
    })), { cancelable: true });
  }

  return (
    <View style={{ position: 'relative', minWidth: 150 }}>
      <TouchableOpacity onPress={openHouseholdSelector} activeOpacity={0.75} style={{ paddingVertical: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textPrimary, lineHeight: 20 }}>{category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.textSecondary, lineHeight: 14 }}>{activeHouseholdName}</Text>
          <Feather name="chevron-down" size={13} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function HouseTasksScreen({ navigation, route }: Props) {
  const { householdId, householdName, initialCategory, highlightTaskId } = route.params;
  const isCategoryPage = !!initialCategory;
  const { user } = useAuth();
  const { data: households } = useHouseholds();
  const { data: tasks, isLoading, refetch } = useHouseTasks(householdId);
  const { data: taskActivity = [] } = useHouseTaskActivity(householdId);
  const { data: shoppingLists = [] } = useShoppingLists(householdId);
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HouseTask | null>(null);
  const [draggedKanbanTaskId, setDraggedKanbanTaskId] = useState<string | null>(null);
  const [kanbanDragX, setKanbanDragX] = useState(0);
  const [newTaskDatePickerVisible, setNewTaskDatePickerVisible] = useState(false);
  const [detailDatePickerVisible, setDetailDatePickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const highlightAnim = React.useRef(new Animated.Value(0)).current;
  const members = households?.find((item) => item.id === householdId)?.members ?? [];
  const {
    lastSeenAt: taskActivitySeenAt,
    markSeen: markTaskActivitySeen,
  } = useActivitySeen(`tasks:${initialCategory ?? 'all'}`, householdId, taskActivity, user?.id);
  const helpSheet = useBottomSheetMotion({
    onOpen: () => setHelpVisible(true),
    onClose: () => setHelpVisible(false),
  });
  const alertsSheet = useBottomSheetMotion({
    onOpen: () => {
      setAlertsVisible(true);
      markTaskActivitySeen();
    },
    onClose: () => setAlertsVisible(false),
  });
  React.useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
      setCategory(initialCategory);
      setShowCategoryFilters(true);
    }
  }, [initialCategory]);

  const { alertSections, alertCount } = useTaskAlerts({
    tasks,
    activity: taskActivity,
    category: initialCategory,
    userId: user?.id,
    lastSeenAt: taskActivitySeenAt,
    onOpenTask: setSelectedTask,
  });

  React.useEffect(() => {
    (navigation as any).setOptions({
      title: initialCategory ?? 'Tarefas da casa',
      headerTitle: initialCategory ? () => <TaskHouseholdHeader category={initialCategory} householdName={householdName} /> : undefined,
      headerAlert: () => (
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={alertsSheet.open}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="bell" size={23} color={Colors.textPrimary} />
          {alertCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{alertCount > 99 ? '99+' : alertCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={helpSheet.open}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="help-circle" size={23} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.getParent()?.navigate('Menu' as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="menu" size={30} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [alertCount, householdName, initialCategory, navigation, alertsSheet.open, helpSheet.open]);

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

  const kanbanTasks = useMemo(() => {
    return (tasks ?? []).filter((task) => {
      if (isCategoryPage && task.category !== initialCategory) return false;
      if (categoryFilter !== 'Todas' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, initialCategory, isCategoryPage, tasks]);

  const categoryPendingCount = useMemo(
    () => kanbanTasks.filter((task) => !task.done && task.status !== 'completed' && task.status !== 'skipped').length,
    [kanbanTasks],
  );

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
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
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Não foi possível criar a tarefa', Array.isArray(message) ? message[0] : message || 'Verifique sua conexão e tente novamente.');
    }
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

  async function updateSelectedTask(data: {
    status?: HouseTask['status'];
    shoppingListId?: string | null;
    assignmentType?: HouseTask['assignmentType'];
    assignedToId?: string | null;
    dueDate?: string | null;
  }) {
    if (!selectedTask) return;
    try {
      const updated = await updateStatus.mutateAsync({ taskId: selectedTask.id, ...data });
      setSelectedTask(updated);
    } catch {
      Alert.alert('Não foi possível atualizar a tarefa', 'Tente novamente em instantes.');
    }
  }

  React.useEffect(() => {
    if (!highlightTaskId || !tasks?.some((task) => task.id === highlightTaskId)) return;
    highlightAnim.setValue(0);
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.delay(650),
      Animated.timing(highlightAnim, { toValue: 0, duration: 950, useNativeDriver: false }),
    ]).start();
  }, [highlightAnim, highlightTaskId, tasks]);

  function createKanbanMoveGesture(task: HouseTask) {
    return Gesture.Pan()
      .activateAfterLongPress(380)
      .runOnJS(true)
      .onBegin(() => {
        setDraggedKanbanTaskId(task.id);
        setKanbanDragX(0);
      })
      .onUpdate((event) => setKanbanDragX(Math.max(-110, Math.min(110, event.translationX))))
      .onFinalize((event, success) => {
        setDraggedKanbanTaskId(null);
        setKanbanDragX(0);
        if (!success || Math.abs(event.translationX) < 64) return;

        const flow: HouseTask['status'][] = ['pending', 'in_progress', 'completed'];
        const currentIndex = flow.indexOf(task.done ? 'completed' : task.status);
        const nextIndex = currentIndex + (event.translationX > 0 ? 1 : -1);
        const nextStatus = flow[nextIndex];

        if (nextStatus) updateStatus.mutate({ taskId: task.id, status: nextStatus });
      });
  }

  function renderTask({ item }: { item: HouseTask }) {
    const label = dueLabel(item.dueDate);
    const late = isLate(item);
    const isHighlighted = item.id === highlightTaskId;
    const highlightStyle = isHighlighted
      ? {
        backgroundColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.card, Colors.accent + '24'],
        }),
        borderColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [late ? Colors.destructive : Colors.separator, Colors.accent],
        }),
      }
      : null;

    return (
      <AnimatedTouchableOpacity
        style={[styles.taskCard, item.done && styles.taskCardDone, late && styles.taskCardLate, highlightStyle]}
        onPress={() => setSelectedTask(item)}
        activeOpacity={0.78}
      >
        <TouchableOpacity
          style={[styles.checkbox, item.done && styles.checkboxDone]}
          onPress={() => updateStatus.mutate({ taskId: item.id, done: !item.done })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {item.done && <Feather name="check" size={15} color="#fff" />}
        </TouchableOpacity>

        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {item.category && <Text style={styles.metaText}>{item.category}</Text>}
            {label && <Text style={[styles.metaText, late && styles.metaTextLate]}>{label}</Text>}
            <Text style={styles.metaText}>{item.assignmentType === 'all' ? 'Todos' : item.assignedTo?.name ? item.assignedTo.name.split(' ')[0] : 'Sem responsavel'}</Text>
            {item.recurrence !== 'none' && <Text style={styles.metaText}>{item.recurrence === 'weekly' ? 'Toda semana' : item.recurrence === 'daily' ? 'Todo dia' : item.recurrence === 'monthly' ? 'Todo mes' : 'Recorrente'}</Text>}
            {item.shoppingList && <Text style={styles.metaText}>Lista: {item.shoppingList.name}</Text>}
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
      </AnimatedTouchableOpacity>
    );
  }

  function renderKanbanColumn(title: string, status: 'pending' | 'in_progress' | 'completed') {
    const items = kanbanTasks.filter((task) => (status === 'completed' ? task.done : task.status === status && !task.done));
    return <View key={status} style={styles.kanbanColumn}>
      <Text style={styles.kanbanTitle}>{title} ({items.length})</Text>
      {items.map((task) => (
        <GestureDetector key={task.id} gesture={createKanbanMoveGesture(task)}>
          <TouchableOpacity
            style={[
              styles.kanbanCard,
              draggedKanbanTaskId === task.id && styles.kanbanCardDragging,
              draggedKanbanTaskId === task.id && kanbanDragX > 12 && styles.kanbanCardMovingForward,
              draggedKanbanTaskId === task.id && kanbanDragX < -12 && styles.kanbanCardMovingBack,
              draggedKanbanTaskId === task.id && { transform: [{ translateX: kanbanDragX }, { scale: 1.02 }] },
            ]}
            onPress={() => setSelectedTask(task)}
            activeOpacity={0.75}
          >
            <Text style={styles.kanbanCardTitle}>{task.title}</Text>
            <Text style={styles.kanbanCardMeta}>{task.assignedTo?.name?.split(' ')[0] ?? (task.assignmentType === 'all' ? 'Todos' : 'Sem responsavel')}</Text>
          </TouchableOpacity>
        </GestureDetector>
      ))}
      {items.length === 0 && <Text style={styles.kanbanEmpty}>Nenhuma tarefa</Text>}
    </View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={[styles.list, visibleTasks.length === 0 && styles.listEmpty]}
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
            {isCategoryPage && <View style={styles.categoryPageHeader}>
              <Text style={styles.categoryContextText}>{categoryPendingCount} {categoryPendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'} nesta categoria</Text>
              <TouchableOpacity
                style={[styles.completedToggle, statusFilter === 'done' && styles.completedToggleActive]}
                onPress={() => setStatusFilter((current) => current === 'done' ? 'open' : 'done')}
              >
                <Text style={[styles.completedToggleText, statusFilter === 'done' && styles.completedToggleTextActive]}>
                  {statusFilter === 'done' ? 'Ver pendentes' : 'Concluídas'}
                </Text>
              </TouchableOpacity>
            </View>}
            <Text style={styles.sectionTitle}>Visão geral</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanbanBoard}>{renderKanbanColumn('A fazer', 'pending')}{renderKanbanColumn('Em andamento', 'in_progress')}{renderKanbanColumn('Concluídas', 'completed')}</ScrollView>
            <Text style={styles.sectionTitle}>Tarefas</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nada por aqui</Text>
              <Text style={styles.emptySubtitle}>Crie tarefas como lavar toalhas, trocar filtro ou comprar gas.</Text>
            </View>
          ) : (
            <ActivityIndicator color={Colors.accent} />
          )
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => setSheetVisible(true)} activeOpacity={0.8}>
          <Text style={styles.buttonText}>+ Nova tarefa</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSheetVisible(false)} />
          <KeyboardAvoidingView style={styles.sheetKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
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

              {!isCategoryPage && <DropdownField
                label="Categoria"
                value={category ?? NONE_VALUE}
                options={[{ label: 'Sem categoria', value: NONE_VALUE }, ...CATEGORIES.map((item) => ({ label: item, value: item }))]}
                onChange={(value) => setCategory(value === NONE_VALUE ? null : value)}
              />}

              <DropdownField
                label="Responsável"
                value={assignmentType === 'user' && assignedToId ? `user:${assignedToId}` : assignmentType}
                options={[
                  { label: 'Sem responsável', value: 'unassigned' },
                  { label: 'Todos', value: 'all' },
                  ...members.map((member) => ({ label: member.user?.name ?? 'Membro', value: `user:${member.userId}` })),
                ]}
                onChange={(value) => {
                  if (value === 'unassigned' || value === 'all') { setAssignmentType(value); setAssignedToId(null); }
                  else { setAssignmentType('user'); setAssignedToId(value.slice(5)); }
                }}
              />

              <DropdownField
                label="Repetição"
                value={recurrence}
                options={[{ label: 'Não repetir', value: 'none' }, { label: 'Todo dia', value: 'daily' }, { label: 'Toda semana', value: 'weekly' }, { label: 'A cada 15 dias', value: 'biweekly' }, { label: 'Todo mês', value: 'monthly' }]}
                onChange={(value) => setRecurrence(value as HouseTask['recurrence'])}
              />

              <DropdownField
                label="Lembrete"
                value={reminder}
                options={[{ label: 'Sem lembrete', value: 'none' }, { label: 'No prazo', value: 'due' }, { label: '1 dia antes', value: 'one_day_before' }]}
                onChange={(value) => setReminder(value as HouseTask['reminder'])}
              />

              <DateField value={dueDate} onPress={() => setNewTaskDatePickerVisible(true)} onClear={() => setDueDate(null)} />
              {newTaskDatePickerVisible && <DateTimePicker
                value={dateFromKey(dueDate)}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setNewTaskDatePickerVisible(false);
                  if (selectedDate) setDueDate(dateKeyFromPicker(selectedDate));
                }}
              />}

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
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!selectedTask} transparent animationType="slide" onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSelectedTask(null)} />
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedTask?.title}</Text>
            {!!selectedTask?.description && <Text style={styles.taskDetailDescription}>{selectedTask.description}</Text>}

            <DropdownField
              label="Responsável"
              value={selectedTask?.assignmentType === 'user' && selectedTask.assignedToId ? `user:${selectedTask.assignedToId}` : selectedTask?.assignmentType ?? 'unassigned'}
              options={[
                { label: 'Sem responsável', value: 'unassigned' },
                { label: 'Todos', value: 'all' },
                ...members.map((member) => ({ label: member.user?.name ?? 'Membro', value: `user:${member.userId}` })),
              ]}
              onChange={(value) => {
                if (value === 'unassigned' || value === 'all') updateSelectedTask({ assignmentType: value, assignedToId: null });
                else updateSelectedTask({ assignmentType: 'user', assignedToId: value.slice(5) });
              }}
            />

            <DateField value={selectedTask?.dueDate ?? null} onPress={() => setDetailDatePickerVisible(true)} onClear={() => updateSelectedTask({ dueDate: null })} />
            {detailDatePickerVisible && <DateTimePicker
              value={dateFromKey(selectedTask?.dueDate ?? null)}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setDetailDatePickerVisible(false);
                if (selectedDate) updateSelectedTask({ dueDate: dateKeyFromPicker(selectedDate) });
              }}
            />}

            <DropdownField
              label="Status"
              value={selectedTask?.status ?? 'pending'}
              options={[{ label: 'A fazer', value: 'pending' }, { label: 'Em andamento', value: 'in_progress' }, { label: 'Concluída', value: 'completed' }, { label: 'Não fazer', value: 'skipped' }]}
              onChange={(value) => updateSelectedTask({ status: value as HouseTask['status'] })}
            />

            <DropdownField
              label="Lista de compras vinculada"
              value={selectedTask?.shoppingListId ?? NONE_VALUE}
              options={[{ label: 'Sem lista', value: NONE_VALUE }, ...shoppingLists.map((list) => ({ label: list.name, value: list.id }))]}
              onChange={(value) => updateSelectedTask({ shoppingListId: value === NONE_VALUE ? null : value })}
            />
          </ScrollView>
        </View>
      </Modal>

      <HelpSheet
        visible={helpVisible}
        height={helpSheet.height}
        translateY={helpSheet.translateY}
        panHandlers={helpSheet.panHandlers}
        sections={TASK_HELP_SECTIONS}
        subtitle={initialCategory ? `Tarefas: ${initialCategory}` : 'Guia rápido das tarefas'}
        introTitle="Como organizar tarefas da casa"
        introText="Use tarefas para rotinas, pendências e combinados que não são estoque, como limpar, comprar gás, trocar filtro ou cuidar da manutenção."
        highlights={TASK_HELP_HIGHLIGHTS}
        groupTitle="Funções das tarefas"
        onClose={helpSheet.close}
      />
      <AlertsSheet
        visible={alertsVisible}
        height={alertsSheet.height}
        translateY={alertsSheet.translateY}
        panHandlers={alertsSheet.panHandlers}
        subtitle={initialCategory ? `Tarefas: ${initialCategory}` : 'Tarefas da casa'}
        sections={alertSections}
        onClose={alertsSheet.close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 },
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
  categoryPageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  categoryContextText: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  completedToggle: { borderWidth: 1, borderColor: Colors.separator, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: Colors.card },
  completedToggleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  completedToggleText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  completedToggleTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  kanbanBoard: { gap: 10, paddingBottom: 14 },
  kanbanColumn: { width: 218, minHeight: 270, backgroundColor: Colors.accent + '0D', borderRadius: 10, padding: 10, gap: 8 },
  kanbanTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  kanbanCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator, borderRadius: 9, padding: 10, gap: 4 },
  kanbanCardDragging: { opacity: 0.82, borderColor: Colors.accent, zIndex: 4, elevation: 4 },
  kanbanCardMovingForward: { backgroundColor: Colors.success + '18', borderColor: Colors.success },
  kanbanCardMovingBack: { backgroundColor: Colors.accent + '18', borderColor: Colors.accent },
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
    maxHeight: '94%',
  },
  sheetKeyboard: { justifyContent: 'flex-end', maxHeight: '100%' },
  sheetContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 8 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  taskDetailDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 6 },
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
});

