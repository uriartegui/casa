import { ShoppingItem } from '../../types';

export function compareShoppingItemNames(a: ShoppingItem, b: ShoppingItem) {
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
}

export function buildShoppingListSections(
  pending: ShoppingItem[],
  bought: ShoppingItem[],
  categoryOrder: string[],
) {
  const pendingByCategory = new Map<string, ShoppingItem[]>();
  for (const item of pending) {
    const category = item.category || 'Outros';
    const group = pendingByCategory.get(category);
    if (group) group.push(item);
    else pendingByCategory.set(category, [item]);
  }

  const onlyUncategorized = pendingByCategory.size === 1 && pendingByCategory.has('Outros');
  const pendingSections = onlyUncategorized
    ? [{ title: `A COMPRAR (${pending.length})`, data: [...pending].sort(compareShoppingItemNames), isPending: true }]
    : [...pendingByCategory.entries()]
      .sort((a, b) => {
        const rankA = categoryOrder.indexOf(a[0]);
        const rankB = categoryOrder.indexOf(b[0]);
        return (rankA === -1 ? categoryOrder.length : rankA) - (rankB === -1 ? categoryOrder.length : rankB)
          || a[0].localeCompare(b[0], 'pt-BR');
      })
      .map(([category, data]) => ({
        title: `${category} (${data.length})`,
        data: [...data].sort(compareShoppingItemNames),
        isPending: true,
      }));

  return [
    ...(pending.length > 0 ? pendingSections : []),
    ...(bought.length > 0
      ? [{ title: `COMPRADOS (${bought.length})`, data: [...bought].sort(compareShoppingItemNames), isPending: false }]
      : []),
  ];
}
