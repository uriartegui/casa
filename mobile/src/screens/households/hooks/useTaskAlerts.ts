import React from 'react';
import { HouseTask, HouseTaskActivityEvent } from '../../../types';
import { buildTaskActivityAlerts, buildTaskAttention, countAlerts } from '../../../utils/alertCenter';

type UseTaskAlertsParams = {
  tasks?: HouseTask[];
  activity: HouseTaskActivityEvent[];
  category?: string | null;
  userId?: string | null;
  lastSeenAt: string | null;
  onOpenTask: (task: HouseTask) => void;
};

export function useTaskAlerts({
  tasks,
  activity,
  category,
  userId,
  lastSeenAt,
  onOpenTask,
}: UseTaskAlertsParams) {
  const alertSections = React.useMemo(() => [
    {
      title: 'Precisa de atenção',
      items: buildTaskAttention(tasks ?? [], {
        category,
        userId,
        onOpenTask,
      }),
      emptyText: category ? 'Nenhuma tarefa urgente nesta categoria.' : 'Nenhuma tarefa urgente agora.',
    },
    {
      title: 'Atividades novas',
      items: buildTaskActivityAlerts(activity, {
        category,
        localUserId: userId,
        since: lastSeenAt,
      }),
      emptyText: 'Nenhuma atividade nova nas tarefas.',
    },
  ], [activity, category, lastSeenAt, onOpenTask, tasks, userId]);

  return {
    alertSections,
    alertCount: countAlerts(alertSections),
  };
}
