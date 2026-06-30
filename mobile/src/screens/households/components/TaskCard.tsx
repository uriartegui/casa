import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { HouseTask } from '../../../types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type TaskCardProps = {
  task: HouseTask;
  label: string | null;
  late: boolean;
  highlightStyle: any;
  onOpen: (task: HouseTask) => void;
  onToggleDone: (task: HouseTask) => void;
  onDelete: (task: HouseTask) => void;
};

function assigneeLabel(task: HouseTask) {
  if (task.assignmentType === 'all') return 'Todos';
  return task.assignedTo?.name ? task.assignedTo.name.split(' ')[0] : 'Sem responsável';
}

function recurrenceLabel(task: HouseTask) {
  if (task.recurrence === 'none') return null;
  if (task.recurrence === 'weekly') return 'Toda semana';
  if (task.recurrence === 'daily') return 'Todo dia';
  if (task.recurrence === 'monthly') return 'Todo mês';
  return 'Recorrente';
}

export function TaskCard({ task, label, late, highlightStyle, onOpen, onToggleDone, onDelete }: TaskCardProps) {
  const recurrence = recurrenceLabel(task);

  return (
    <AnimatedTouchableOpacity
      style={[styles.taskCard, task.done && styles.taskCardDone, late && styles.taskCardLate, highlightStyle]}
      onPress={() => onOpen(task)}
      activeOpacity={0.78}
    >
      <TouchableOpacity
        style={[styles.checkbox, task.done && styles.checkboxDone]}
        onPress={() => onToggleDone(task)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {task.done && <Feather name="check" size={15} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          {task.category && <Text style={styles.metaText}>{task.category}</Text>}
          {label && <Text style={[styles.metaText, late && styles.metaTextLate]}>{label}</Text>}
          <Text style={styles.metaText}>{assigneeLabel(task)}</Text>
          {recurrence && <Text style={styles.metaText}>{recurrence}</Text>}
          {task.shoppingList && <Text style={styles.metaText}>Lista: {task.shoppingList.name}</Text>}
          {task.done && task.completedBy?.name && (
            <Text style={styles.metaText}>por {task.completedBy.name.split(' ')[0]}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(task)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
