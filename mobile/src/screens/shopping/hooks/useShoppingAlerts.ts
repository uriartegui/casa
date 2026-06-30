import React from 'react';
import { ShoppingActivityEvent, ShoppingList } from '../../../types';
import { buildShoppingActivityAlerts, buildShoppingAttention, countAlerts } from '../../../utils/alertCenter';

type UseShoppingAlertsParams = {
  lists?: ShoppingList[];
  activity?: ShoppingActivityEvent[];
  userId?: string | null;
  lastSeenAt: string | null;
  onOpenList: (list: ShoppingList) => void;
};

export function useShoppingAlerts({
  lists,
  activity,
  userId,
  lastSeenAt,
  onOpenList,
}: UseShoppingAlertsParams) {
  const alertSections = React.useMemo(() => [
    {
      title: 'Precisa de atenção',
      items: buildShoppingAttention(lists ?? [], { onOpenList }),
      emptyText: 'Nenhuma lista urgente ou pendente agora.',
    },
    {
      title: 'Atividades novas',
      items: buildShoppingActivityAlerts(activity ?? [], {
        localUserId: userId,
        since: lastSeenAt,
      }),
      emptyText: 'Nenhuma atividade nova nas listas.',
    },
  ], [activity, lastSeenAt, lists, onOpenList, userId]);

  return {
    alertSections,
    alertCount: countAlerts(alertSections),
  };
}
