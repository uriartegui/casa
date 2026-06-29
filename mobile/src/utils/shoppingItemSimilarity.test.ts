import { describe, expect, it } from 'vitest';
import { ShoppingItem } from '../types';
import { findSimilarShoppingItem, mergedShoppingQuantity, normalizeShoppingItemName } from './shoppingItemSimilarity';

const baseItem = {
  quantity: 1,
  unit: 'un',
  category: null,
  householdId: 'household-1',
  shoppingListId: 'list-1',
  createdAt: '2026-06-15T00:00:00.000Z',
} satisfies Partial<ShoppingItem>;

function item(input: Pick<ShoppingItem, 'id' | 'name' | 'checked'>): ShoppingItem {
  return { ...baseItem, ...input } as ShoppingItem;
}

describe('shoppingItemSimilarity', () => {
  it('normalizes accents, whitespace and casing', () => {
    expect(normalizeShoppingItemName('  Pão   DE Forma  ')).toBe('pao de forma');
  });

  it('prefers unchecked similar items', () => {
    const checked = item({ id: '1', name: 'Milho', checked: true });
    const unchecked = item({ id: '2', name: 'Milho verde', checked: false });

    expect(findSimilarShoppingItem([checked, unchecked], 'milho')).toBe(unchecked);
  });

  it('merges quantities numerically', () => {
    expect(mergedShoppingQuantity(item({ id: '1', name: 'Leite', checked: false }), 3)).toBe(4);
  });
});
