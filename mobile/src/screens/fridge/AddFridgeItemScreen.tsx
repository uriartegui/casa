import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import DateField from '../../components/DateField';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddFridgeItem } from '../../hooks/useFridge';
import { Colors } from '../../constants/colors';
import { getCategoriesForStorage } from '../../constants/categories';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';
import { useStorages } from '../../hooks/useStorages';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'AddFridgeItem'>;
  route: RouteProp<FridgeStackParamList, 'AddFridgeItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

export default function AddFridgeItemScreen({ navigation, route }: Props) {
  const { householdId, storageId } = route.params;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('un');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const addItem = useAddFridgeItem(householdId);
  const { data: storages } = useStorages(householdId);
  const currentStorage = storages?.find((s) => s.id === storageId);
  const categories = getCategoriesForStorage(currentStorage?.name);

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
      const expStr = expirationDate ? expirationDate.toISOString().split('T')[0] : undefined;
await addItem.mutateAsync({ name: name.trim(), quantity: qty, unit, storageId, expirationDate: expStr, category: category ?? undefined });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do item</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Leite"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoCorrect={false}
          spellCheck={false}
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

        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={addItem.isPending}>
          {addItem.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Adicionar</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10, paddingBottom: 120 },
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
  optional: { fontSize: 11, color: Colors.textSecondary, fontWeight: '400', textTransform: 'none' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
