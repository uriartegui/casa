import React from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { HouseTask } from '../../../types';

const KANBAN_STATUS_FLOW: HouseTask['status'][] = ['pending', 'in_progress', 'completed'];

function nextKanbanStatus(task: HouseTask, translationX: number) {
  const currentIndex = KANBAN_STATUS_FLOW.indexOf(task.done ? 'completed' : task.status);
  const nextIndex = currentIndex + (translationX > 0 ? 1 : -1);
  return KANBAN_STATUS_FLOW[nextIndex] ?? null;
}

export function useTaskKanbanDrag({
  onMove,
}: {
  onMove: (taskId: string, status: HouseTask['status']) => void;
}) {
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragX, setDragX] = React.useState(0);

  const createMoveGesture = React.useCallback((task: HouseTask) => (
    Gesture.Pan()
      .activateAfterLongPress(380)
      .runOnJS(true)
      .onBegin(() => {
        setDraggedTaskId(task.id);
        setDragX(0);
      })
      .onUpdate((event) => setDragX(Math.max(-110, Math.min(110, event.translationX))))
      .onFinalize((event, success) => {
        setDraggedTaskId(null);
        setDragX(0);
        if (!success || Math.abs(event.translationX) < 64) return;

        const nextStatus = nextKanbanStatus(task, event.translationX);
        if (nextStatus) onMove(task.id, nextStatus);
      })
  ), [onMove]);

  return {
    draggedTaskId,
    dragX,
    createMoveGesture,
  };
}
