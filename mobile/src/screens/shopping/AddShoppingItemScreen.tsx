import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { filterItems, categoryFor } from '../../constants/commonItems';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddListItem, useListItems, useUpdateListItem } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingItem, Unit } from '../../types';
import {
  findSimilarShoppingItem,
  mergedShoppingQuantity,
  parseQuantityInput,
  similarShoppingItemMessage,
} from '../../utils/shoppingItemSimilarity';
import { Typography } from '../../theme/typography';

type Params = {
  householdId: string;
  listId?: string;
  prefillName?: string;
  prefillQuantity?: number;
  prefillUnit?: string;
};

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'AddShoppingItem'>;
  route: RouteProp<{ AddShoppingItem: Params }, 'AddShoppingItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

export default function AddShoppingItemScreen({ navigation, route }: Props) {
  const { householdId, listId, prefillName, prefillQuantity, prefillUnit } = route.params;
  const [name, setName] = useState(prefillName ?? '');
  const [nameFocused, setNameFocused] = useState(false);
  const suggestions = useMemo(() => filterItems(name), [name]);
  const [quantity, setQuantity] = useState(prefillQuantity ? String(prefillQuantity) : '1');
  const [unit, setUnit] = useState<Unit>((prefillUnit as Unit) ?? 'un');
  const addItem = useAddListItem(householdId, listId ?? '');
  const updateItem = useUpdateListItem(householdId, listId ?? '');
  const { data: existingItems } = useListItems(householdId, listId ?? null);

  function askMerge(existingItem: ShoppingItem, qty: number) {
    return new Promise<'merge' | 'separate'>((resolve) => {
      Alert.alert(
        'Item parecido encontrado',
        similarShoppingItemMessage(existingItem, qty, unit),
        [
          { text: 'Adicionar separado', style: 'cancel', onPress: () => resolve('separate') },
          { text: 'Juntar', onPress: () => resolve('merge') },
        ],
      );
    });
  }

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseQuantityInput(quantity);
    if (qty === null) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    try {
      const trimmedName = name.trim();
      const similarItem = listId ? findSimilarShoppingItem(existingItems, trimmedName) : null;
      if (similarItem) {
        const choice = await askMerge(similarItem, qty);
        if (choice === 'merge') {
          await updateItem.mutateAsync({
            itemId: similarItem.id,
            quantity: mergedShoppingQuantity(similarItem, qty),
            unit: similarItem.unit ?? unit,
            category: similarItem.category ?? categoryFor(trimmedName) ?? null,
          });
          navigation.goBack();
          return;
        }
      }
      await addItem.mutateAsync({
        name: trimmedName,
        quantity: qty,
        unit,
        category: categoryFor(trimmedName) ?? undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do item</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Leite"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setTimeout(() => setNameFocused(false), 150)}
          returnKeyType="next"
          autoCorrect={false}
          spellCheck={false}
        />
        {nameFocused && suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { setName(s); setNameFocused(false); Keyboard.dismiss(); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          placeholder="1"
          placeholderTextColor={Colors.textSecondary}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>Unidade</Text>
        <View style={styles.unitRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitChip, unit === u && styles.unitChipActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={addItem.isPending}>
          {addItem.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Adicionar à lista</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 26, paddingTop: 26, gap: 12, paddingBottom: 140 },
  label: { fontFamily: Typography.title, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 10 },
  input: {
    minHeight: 56,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  unitRow: { flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: 18, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator, overflow: 'hidden' },
  unitChip: { minWidth: 48, minHeight: 36, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitChipText: { fontFamily: Typography.rounded, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  unitChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 20, textAlign: 'center' },
  suggestions: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    marginTop: -4,
  },
  suggestionItem: {
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  suggestionText: { fontFamily: Typography.body, fontSize: 15, color: Colors.textPrimary },
});
