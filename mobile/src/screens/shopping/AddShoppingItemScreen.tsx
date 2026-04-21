import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddShoppingItem } from '../../hooks/useShoppingList';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'AddShoppingItem'>;
  route: RouteProp<ShoppingStackParamList, 'AddShoppingItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

export default function AddShoppingItemScreen({ navigation, route }: Props) {
  const { householdId, prefillName, prefillQuantity, prefillUnit } = route.params;
  const [name, setName] = useState(prefillName ?? '');
  const [quantity, setQuantity] = useState(prefillQuantity ? String(prefillQuantity) : '1');
  const [unit, setUnit] = useState<Unit>((prefillUnit as Unit) ?? 'un');
  const addItem = useAddShoppingItem(householdId);

  async function handleAdd() {
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
      await addItem.mutateAsync({ name: name.trim(), quantity: qty, unit });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
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
          placeholder="Ex: Leite"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus={!prefillName}
          returnKeyType="next"
        />

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
});
