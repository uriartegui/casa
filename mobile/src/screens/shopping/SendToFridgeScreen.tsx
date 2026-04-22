import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { useStorages } from '../../hooks/useStorages';
import { useRemoveListItem } from '../../hooks/useShoppingLists';
import DateField from '../../components/DateField';

type CategoryChip = { label: string; value: string };

const STORAGE_CATEGORIES: Record<string, CategoryChip[]> = {
  geladeira: [
    { label: '🥛 Laticínios', value: 'Laticínios' },
    { label: '🍖 Carnes & Ovos', value: 'Carnes & Ovos' },
    { label: '🍎 Frutas', value: 'Frutas' },
    { label: '🥬 Verduras/Legumes', value: 'Verduras/Legumes' },
    { label: '🧃 Bebidas', value: 'Bebidas' },
    { label: '🫙 Molhos & Condimentos', value: 'Molhos & Condimentos' },
    { label: '🍽️ Prontos/Restos', value: 'Prontos/Restos' },
  ],
  freezer: [
    { label: '🧊 Carnes congeladas', value: 'Carnes congeladas' },
    { label: '🥬 Vegetais congelados', value: 'Vegetais congelados' },
    { label: '🍕 Pratos prontos', value: 'Pratos prontos' },
    { label: '🍦 Sobremesas', value: 'Sobremesas' },
    { label: '🥖 Pães congelados', value: 'Pães congelados' },
  ],
  despensa: [
    { label: '🌾 Grãos & Cereais', value: 'Grãos & Cereais' },
    { label: '🥫 Enlatados/Conservas', value: 'Enlatados/Conservas' },
    { label: '🍝 Massas & Farinhas', value: 'Massas & Farinhas' },
    { label: '🍪 Snacks & Biscoitos', value: 'Snacks & Biscoitos' },
    { label: '🫙 Temperos & Condimentos', value: 'Temperos & Condimentos' },
    { label: '🧃 Bebidas', value: 'Bebidas' },
  ],
};

function getCategoriesForStorage(name: string): CategoryChip[] {
  const key = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  for (const [k, cats] of Object.entries(STORAGE_CATEGORIES)) {
    if (key.includes(k)) return cats;
  }
  return [];
}
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'SendToFridge'>;
  route: RouteProp<ShoppingStackParamList, 'SendToFridge'>;
};

export default function SendToFridgeScreen({ navigation, route }: Props) {
  const { householdId, listId, itemId, prefillName, prefillQuantity, prefillUnit, listName } = route.params;

  const { data: storages } = useStorages(householdId);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [category, setCategory] = useState('');

  const selectedStorage = storages?.find((s) => s.id === selectedStorageId);
  const categoryChips = selectedStorage ? getCategoriesForStorage(selectedStorage.name) : [];

  React.useEffect(() => {
    if (storages && storages.length > 0 && selectedStorageId === null) {
      setSelectedStorageId(storages[0].id);
    }
  }, [storages, selectedStorageId]);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const addToFridge = useAddFridgeItem(householdId);
  const removeFromList = useRemoveListItem(householdId, listId);

  async function handleSend() {
    const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : undefined;
    try {
      await addToFridge.mutateAsync({
        name: prefillName,
        quantity: Number(prefillQuantity),
        unit: prefillUnit ?? 'un',
        storageId: selectedStorageId ?? undefined,
        category: category.trim() || undefined,
        expirationDate: expStr,
        fromShoppingListName: listName,
      });
      await removeFromList.mutateAsync(itemId);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  const isPending = addToFridge.isPending || removeFromList.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.itemPreview}>
          <Text style={styles.itemName}>{prefillName}</Text>
          <Text style={styles.itemQty}>{prefillQuantity} {prefillUnit}</Text>
        </View>

        {storages && storages.length > 0 && (
          <>
            <Text style={styles.label}>Compartimento</Text>
            <View style={styles.chipRow}>
              {storages.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selectedStorageId === s.id && styles.chipActive]}
                  onPress={() => setSelectedStorageId(s.id)}
                >
                  <Text style={[styles.chipText, selectedStorageId === s.id && styles.chipTextActive]}>
                    {s.emoji} {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedStorageId && categoryChips.length > 0 && (
          <>
            <Text style={styles.label}>Categoria (opcional)</Text>
            <View style={styles.chipRow}>
              {categoryChips.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.chip, category === cat.value && styles.chipActive]}
                  onPress={() => setCategory(cat.value === category ? '' : cat.value)}
                >
                  <Text style={[styles.chipText, category === cat.value && styles.chipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Validade <Text style={styles.optional}>(opcional)</Text></Text>
        <DateField value={expirationDate} onChange={setExpirationDate} />

        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Adicionar à geladeira</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10 },
  itemPreview: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.separator, marginBottom: 8,
  },
  itemName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  itemQty: { fontSize: 14, color: Colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
});
