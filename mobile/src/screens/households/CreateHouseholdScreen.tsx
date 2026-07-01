import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCreateHousehold } from '../../hooks/useHouseholds';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'CreateHousehold'>;
};

export default function CreateHouseholdScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const createHousehold = useCreateHousehold();
  const { setSelectedHouseholdId } = useSelectedHousehold();

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para a casa.');
      return;
    }
    try {
      const household = await createHousehold.mutateAsync(name.trim());
      setSelectedHouseholdId(household.id);
      navigation.replace('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a casa.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome da casa</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Casa dos Uriarte"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={createHousehold.isPending}>
          {createHousehold.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Criar casa</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, padding: 22, gap: 12, paddingBottom: 120 },
  label: { fontFamily: Typography.title, fontSize: 12, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    fontFamily: Typography.body, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
});
