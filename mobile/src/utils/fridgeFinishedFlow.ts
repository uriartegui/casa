import { Alert } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FridgeItem, ShoppingItem, ShoppingList } from '../types';

type FinishFridgeItemOptions = {
  householdId: string;
  item: FridgeItem;
  shoppingLists?: ShoppingList[];
  shoppingListsLoading?: boolean;
  removeItem: (input: { itemId: string; toShoppingListName?: string }) => Promise<unknown>;
  queryClient: QueryClient;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onDone?: () => void;
};

async function addItemToShoppingList(
  householdId: string,
  listId: string,
  item: FridgeItem,
) {
  const response = await api.post<ShoppingItem>(`/households/${householdId}/shopping-lists/${listId}/items`, {
    name: item.name,
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
    unit: item.unit ?? 'un',
    category: item.category ?? undefined,
    notify: false,
  });

  return response.data;
}

function invalidateShoppingList(queryClient: QueryClient, householdId: string, listId: string) {
  queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
  queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
  queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
}

export function showFinishedFridgeItemAlert({
  householdId,
  item,
  shoppingLists,
  shoppingListsLoading,
  removeItem,
  queryClient,
  showToast,
  onDone,
}: FinishFridgeItemOptions) {
  async function removeOnly() {
    try {
      await removeItem({ itemId: item.id });
      showToast(`${item.name} removido do estoque`, 'success');
      onDone?.();
    } catch {
      Alert.alert('Erro', 'Não foi possível remover o item.');
    }
  }

  async function sendToList(list: ShoppingList) {
    try {
      await addItemToShoppingList(householdId, list.id, item);
      invalidateShoppingList(queryClient, householdId, list.id);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item na lista.');
      return;
    }

    try {
      await removeItem({ itemId: item.id, toShoppingListName: list.name });
      showToast(`${item.name} foi para a lista ${list.name}`, 'success');
      onDone?.();
    } catch {
      Alert.alert(
        'Item adicionado na lista',
        'Ele foi para a lista, mas não foi possível remover do estoque. Tente remover do estoque novamente.',
      );
    }
  }

  function pickList() {
    if (shoppingListsLoading) {
      Alert.alert('Aguarde', 'As listas ainda estão carregando.');
      return;
    }

    const lists = shoppingLists ?? [];
    if (lists.length === 0) {
      Alert.alert('Sem listas', 'Crie uma lista de compras primeiro.');
      return;
    }

    Alert.alert(
      'Escolher lista',
      `Para qual lista mandar "${item.name}"?`,
      [
        ...lists.map((list) => ({
          text: list.name,
          onPress: () => sendToList(list),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  Alert.alert(`"${item.name}" acabou?`, 'Você está removendo este item do estoque.', [
    { text: 'Somente excluir', style: 'destructive', onPress: removeOnly },
    { text: 'Excluir e mandar para lista', onPress: pickList },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
