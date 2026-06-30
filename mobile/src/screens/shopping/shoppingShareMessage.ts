import { ShoppingItem } from '../../types';

function itemLine(prefix: string, item: ShoppingItem) {
  return `${prefix} ${item.name}${item.quantity ? ` (${item.quantity} ${item.unit ?? 'un'})` : ''}`;
}

export function buildShoppingShareMessage({
  listName,
  pending,
  bought,
}: {
  listName: string;
  pending: ShoppingItem[];
  bought: ShoppingItem[];
}) {
  const pendingLines = pending.map((item) => itemLine('☐', item));
  const boughtLines = bought.map((item) => itemLine('✓', item));

  return [
    `Lista: ${listName}`,
    pendingLines.length > 0 ? '\nA comprar:\n' + pendingLines.join('\n') : '',
    boughtLines.length > 0 ? '\nComprados:\n' + boughtLines.join('\n') : '',
  ].filter(Boolean).join('\n');
}
