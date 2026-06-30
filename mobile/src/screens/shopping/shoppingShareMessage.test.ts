import { describe, expect, it } from 'vitest';
import { ShoppingItem } from '../../types';
import { buildShoppingShareMessage } from './shoppingShareMessage';

const baseItem = {
  category: null,
  householdId: 'household-1',
  shoppingListId: 'list-1',
  createdAt: '2026-06-15T00:00:00.000Z',
} satisfies Partial<ShoppingItem>;

function item(input: Pick<ShoppingItem, 'id' | 'name' | 'checked' | 'quantity'> & Partial<ShoppingItem>): ShoppingItem {
  return { ...baseItem, unit: 'un', ...input } as ShoppingItem;
}

describe('buildShoppingShareMessage', () => {
  it('formats pending and bought sections', () => {
    expect(buildShoppingShareMessage({
      listName: 'Mercado',
      pending: [item({ id: '1', name: 'Leite', checked: false, quantity: 2 })],
      bought: [item({ id: '2', name: 'Pão', checked: true, quantity: 1 })],
    })).toBe('Lista: Mercado\n\nA comprar:\n☐ Leite (2 un)\n\nComprados:\n✓ Pão (1 un)');
  });
});
