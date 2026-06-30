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

export function parseShoppingQuantity(value: string) {
  const quantity = parseFloat(value.replace(',', '.'));
  return Number.isNaN(quantity) || quantity <= 0 ? null : quantity;
}

export function stepShoppingQuantity(value: string, delta: number) {
  const current = parseFloat(value.replace(',', '.'));
  const next = Math.max(1, (Number.isNaN(current) ? 1 : current) + delta);
  return String(next);
}

export function similarShoppingItemMessage(item: ShoppingItem, quantityToAdd: number, fallbackUnit: string) {
  const nextQuantity = mergedShoppingQuantity(item, quantityToAdd);
  return `"${item.name}" já está na lista com ${item.quantity} ${item.unit ?? 'un'}.\n\nQuer juntar e deixar ${nextQuantity} ${item.unit ?? fallbackUnit}?`;
}
