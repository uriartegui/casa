import { describe, expect, it } from 'vitest';
import { ShoppingItem } from '../types';
import {
  findSimilarShoppingItem,
  mergedShoppingQuantity,
  normalizeShoppingItemName,
  parseShoppingQuantity,
  similarShoppingItemMessage,
  stepShoppingQuantity,
} from './shoppingItemSimilarity';

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

  it('parses comma and dot quantities', () => {
    expect(parseShoppingQuantity('1,5')).toBe(1.5);
    expect(parseShoppingQuantity('2.25')).toBe(2.25);
    expect(parseShoppingQuantity('0')).toBeNull();
    expect(parseShoppingQuantity('abc')).toBeNull();
  });

  it('steps quantities with a minimum of one', () => {
    expect(stepShoppingQuantity('2', 1)).toBe('3');
    expect(stepShoppingQuantity('1', -1)).toBe('1');
    expect(stepShoppingQuantity('abc', 2)).toBe('3');
  });

  it('builds a similar item merge message', () => {
    expect(similarShoppingItemMessage(item({ id: '1', name: 'Leite', checked: false }), 2, 'kg'))
      .toContain('"Leite" já está na lista');
  });
});
