import React from 'react';
import { useActivitySeen } from '../../../hooks/useActivitySeen';
import { FridgeItem, HouseTask, ShoppingList } from '../../../types';
import {
  buildShoppingActivityAlerts,
  buildShoppingAttention,
  buildStockActivityAlerts,
  buildStockAttention,
  buildTaskActivityAlerts,
  buildTaskAttention,
  countAlerts,
} from '../../../utils/alertCenter';

type ShoppingListAlertTarget = ShoppingList & { householdId: string };

type UseHomeAlertsParams = {
  householdId: string | null;
  localUserId?: string;
  fridgeItems?: FridgeItem[];
  fridgeActivity?: any[];
  houseTasks: HouseTask[];
  taskActivity: any[];
  shoppingLists?: ShoppingListAlertTarget[];
  shoppingActivity: any[];
  onOpenStockItem: (item: FridgeItem) => void;
  onOpenTask: (task: { id: string; category?: string | null }) => void;
  onOpenShoppingList: (list: ShoppingListAlertTarget) => void;
  onOpenStockActivity: (event: { storageId?: string | null; storageName?: string | null; storageEmoji?: string | null }) => void;
};

export function useHomeAlerts({
  householdId,
  localUserId,
  fridgeItems,
  fridgeActivity,
  houseTasks,
  taskActivity,
  shoppingLists,
  shoppingActivity,
  onOpenStockItem,
  onOpenTask,
  onOpenShoppingList,
  onOpenStockActivity,
}: UseHomeAlertsParams) {
  const {
    lastSeenAt: stockActivitySeenAt,
    markSeen: markStockActivitySeen,
  } = useActivitySeen('stock', householdId, fridgeActivity ?? [], localUserId);
  const { markSeen: markTaskActivitySeen, lastSeenAt: taskActivitySeenAt } = useActivitySeen('tasks', householdId, taskActivity, localUserId);
  const { markSeen: markShoppingActivitySeen, lastSeenAt: shoppingActivitySeenAt } = useActivitySeen('shopping', householdId, shoppingActivity, localUserId);

  const alertSections = React.useMemo(() => {
    const attentionItems = [
      ...buildStockAttention(fridgeItems ?? [], { onOpenItem: onOpenStockItem }),
      ...buildTaskAttention(houseTasks, { userId: localUserId, onOpenTask }),
      ...buildShoppingAttention(shoppingLists ?? [], { onOpenList: onOpenShoppingList }),
    ].slice(0, 16);

    const activityItems = [
      ...buildStockActivityAlerts(fridgeActivity ?? [], { localUserId, since: stockActivitySeenAt, onOpenEvent: onOpenStockActivity }),
      ...buildShoppingActivityAlerts(shoppingActivity, { localUserId, since: shoppingActivitySeenAt }),
      ...buildTaskActivityAlerts(taskActivity, { localUserId, since: taskActivitySeenAt }),
    ].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 12);

    return [
      { title: 'Precisa de atenção', items: attentionItems, emptyText: 'Nenhuma urgência na casa agora.' },
      { title: 'Atividades novas', items: activityItems, emptyText: 'Nenhuma atividade nova desde a última vez.' },
    ];
  }, [
    fridgeActivity,
    fridgeItems,
    houseTasks,
    localUserId,
    onOpenShoppingList,
    onOpenStockActivity,
    onOpenStockItem,
    onOpenTask,
    shoppingActivity,
    shoppingActivitySeenAt,
    shoppingLists,
    stockActivitySeenAt,
    taskActivity,
    taskActivitySeenAt,
  ]);

  const markAllSeen = React.useCallback(() => {
    markStockActivitySeen();
    markTaskActivitySeen();
    markShoppingActivitySeen();
  }, [markShoppingActivitySeen, markStockActivitySeen, markTaskActivitySeen]);

  return {
    alertSections,
    activityUnreadCount: countAlerts(alertSections),
    markAllSeen,
  };
}
