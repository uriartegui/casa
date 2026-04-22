import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCreateShoppingList } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'CreateShoppingList'>;
  route: RouteProp<ShoppingStackParamList, 'CreateShoppingList'>;
};

export default function CreateShoppingListScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState('');
  const createList = useCreateShoppingList(householdId);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome da lista.');
      return;
    }
    try {
      await createList.mutateAsync({
        name: name.trim(),
        place: place.trim() || undefined,
        category: category.trim() || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a lista.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome da lista *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Mercado da semana"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoFocus
        />

        <Text style={styles.label}>Lugar de compra</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Extra, Atacadão"
          placeholderTextColor={Colors.textSecondary}
          value={place}
          onChangeText={setPlace}
          returnKeyType="next"
        />

        <Text style={styles.label}>Categoria</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Hortifrúti, Limpeza"
          placeholderTextColor={Colors.textSecondary}
          value={category}
          onChangeText={setCategory}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={createList.isPending}>
          {createList.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Criar lista</Text>
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
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
