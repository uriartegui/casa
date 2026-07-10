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
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'CreateShoppingList'>;
  route: RouteProp<ShoppingStackParamList, 'CreateShoppingList'>;
};

export default function CreateShoppingListScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState('');
  const [urgent, setUrgent] = useState(false);
  const createList = useCreateShoppingList(householdId);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome da lista.');
      return;
    }
    try {
      const created = await createList.mutateAsync({
        name: name.trim(),
        place: place.trim() || undefined,
        category: category.trim() || undefined,
        urgent,
      });
      const params = {
        householdId,
        listId: created.id,
        listName: created.name,
        listUrgent: created.urgent,
        listPlace: created.place,
        listCategory: created.category,
        highlightList: true,
        focusAddItem: true,
      };
      const routeNames = navigation.getState()?.routeNames ?? [];
      if (routeNames.includes('ShoppingListDetail')) {
        navigation.replace('ShoppingListDetail', params);
        return;
      }
      (navigation as any).replace('HomeShoppingListDetail', params);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a lista.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

        <TouchableOpacity style={styles.checkRow} onPress={() => setUrgent((value) => !value)} activeOpacity={0.75}>
          <View style={[styles.checkbox, urgent && styles.checkboxChecked]}>
            {urgent && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkTitle}>Lista urgente</Text>
            <Text style={styles.checkSubtitle}>Marque quando essa compra precisa de prioridade.</Text>
          </View>
        </TouchableOpacity>

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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.separator,
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxMark: { fontFamily: Typography.title, color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  checkTitle: { fontFamily: Typography.title, fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  checkSubtitle: { fontFamily: Typography.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  button: { backgroundColor: Colors.accent, borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '800' },
});
