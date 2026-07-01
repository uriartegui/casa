import React from 'react';
import { FridgeActivityEntry } from '../../../hooks/useFridge';
import { FridgeItem } from '../../../types';
import { buildStockActivityAlerts, buildStockAttention, countAlerts } from '../../../utils/alertCenter';

type UseStockAlertsParams = {
  items?: FridgeItem[];
  allItems?: FridgeItem[];
  activity: FridgeActivityEntry[];
  storageId: string;
  storageName: string;
  lastSeenAt: string | null;
  onOpenItem: (item: FridgeItem) => void;
  onOpenActivity: (event: FridgeActivityEntry) => void;
};

export function useStockAlerts({
  items,
  allItems,
  activity,
  storageId,
  storageName,
  lastSeenAt,
  onOpenItem,
  onOpenActivity,
}: UseStockAlertsParams) {
  const alertSections = React.useMemo(() => {
    const otherItems = (allItems ?? []).filter((item) => item.storageId !== storageId);

    return [
      {
        title: `${storageName}: principais alertas`,
        items: buildStockAttention(items ?? [], {
          storageId,
          storageName,
          onOpenItem,
        }),
        emptyText: 'Nenhum item vencido ou sem categoria neste estoque.',
      },
      {
        title: 'Outros estoques',
        items: buildStockAttention(otherItems, { onOpenItem }),
        emptyText: 'Nenhum alerta nos outros estoques.',
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
    ];
  }, [activity, allItems, items, lastSeenAt, onOpenActivity, onOpenItem, storageId, storageName]);

  return {
    alertSections,
    alertCount: countAlerts(alertSections),
  };
}
