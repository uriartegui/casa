import React from 'react';
import { FridgeActivityEntry } from '../../../hooks/useFridge';
import { FridgeItem } from '../../../types';
import { buildStockActivityAlerts, buildStockAttention, countAlerts } from '../../../utils/alertCenter';

type UseStockAlertsParams = {
  items?: FridgeItem[];
  activity: FridgeActivityEntry[];
  storageId: string;
  storageName: string;
  lastSeenAt: string | null;
  onOpenItem: (item: FridgeItem) => void;
  onOpenActivity: (event: FridgeActivityEntry) => void;
};

export function useStockAlerts({
  items,
  activity,
  storageId,
  storageName,
  lastSeenAt,
  onOpenItem,
  onOpenActivity,
}: UseStockAlertsParams) {
  const alertSections = React.useMemo(() => [
    {
      title: 'Precisa de atenção',
      items: buildStockAttention(items ?? [], {
        storageId,
        storageName,
        onOpenItem,
      }),
      emptyText: 'Nenhum item vencido ou sem categoria neste estoque.',
    },
    {
      title: 'Atividades novas',
      items: buildStockActivityAlerts(activity, {
        storageId,
        since: lastSeenAt,
        onOpenEvent: onOpenActivity,
      }),
      emptyText: 'Nenhuma atividade nova neste estoque.',
    },
  ], [activity, items, lastSeenAt, onOpenActivity, onOpenItem, storageId, storageName]);

  return {
    alertSections,
    alertCount: countAlerts(alertSections),
  };
}
