import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DateField from '../../components/DateField';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useUpdateFridgeItem, useRemoveFridgeItem } from '../../hooks/useFridge';
import { useAddShoppingItem } from '../../hooks/useShoppingList';
import { Colors } from '../../constants/colors';
import { getCategoriesForStorage } from '../../constants/categories';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'FridgeItemDetail'>;
  route: RouteProp<FridgeStackParamList, 'FridgeItemDetail'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];


export default function FridgeItemDetailScreen({ navigation, route }: Props) {
  const { item, householdId } = route.params;
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState<Unit>((item.unit as Unit) ?? 'un');
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    item.expirationDate ? new Date(item.expirationDate + 'T00:00:00') : null
  );
  const [category, setCategory] = useState<string | null>(item.category ?? null);
  const categories = getCategoriesForStorage(item.storage?.name);
  const updateItem = useUpdateFridgeItem(householdId);
  const removeItem = useRemoveFridgeItem(householdId);
  const addToList = useAddShoppingItem(householdId);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    try {
      const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : null;
      await updateItem.mutateAsync({ itemId: item.id, name: name.trim(), quantity: qty, unit, expirationDate: expStr, category: category ?? undefined });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  }

  function handleRemove() {
    Alert.alert(
      `Remover "${item.name}"`,
      'O que deseja fazer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '🛒 Remover + adicionar à lista',
          onPress: () => {
            removeItem.mutate(item.id);
            addToList.mutate({ name: item.name, quantity: item.quantity, unit: item.unit });
            navigation.goBack();
          },
        },
        {
          text: 'Só remover',
          style: 'destructive',
          onPress: () => {
            removeItem.mutate(item.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do item</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          returnKeyType="done"
          placeholderTextColor={Colors.textSecondary}
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

        <Text style={styles.label}>Categoria <Text style={styles.optional}>(opcional)</Text></Text>
        <View style={styles.unitRow}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.unitChip, category === c.label && styles.unitChipActive]}
              onPress={() => setCategory(category === c.label ? null : c.label)}
            >
              <Text style={[styles.unitChipText, category === c.label && styles.unitChipTextActive]}>
                {c.emoji} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Data de validade <Text style={styles.optional}>(opcional)</Text></Text>
        <DateField value={expirationDate} onChange={setExpirationDate} />
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={updateItem.isPending}>
          {updateItem.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Salvar</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <Text style={styles.removeButtonText}>Remover item</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  unitRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  unitChipTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  removeButton: { borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive },
  removeButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
  optional: { fontSize: 11, color: Colors.textSecondary, fontWeight: '400', textTransform: 'none' },
});
