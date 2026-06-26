import { ShoppingItem } from '../types';

export function normalizeShoppingItemName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function findSimilarShoppingItem(items: ShoppingItem[] | undefined, name: string) {
  const normalizedName = normalizeShoppingItemName(name);
  if (!normalizedName) return null;

  const candidates = [...(items ?? [])].sort((a, b) => {
    if (a.checked === b.checked) return 0;
    return a.checked ? 1 : -1;
  });

  return candidates.find((item) => {
    const normalizedItemName = normalizeShoppingItemName(item.name);
    if (!normalizedItemName) return false;
    if (normalizedItemName === normalizedName) return true;
    return normalizedItemName.includes(normalizedName) || normalizedName.includes(normalizedItemName);
  }) ?? null;
}

export function mergedShoppingQuantity(item: ShoppingItem, quantityToAdd: number) {
  return Number(item.quantity) + quantityToAdd;
}
