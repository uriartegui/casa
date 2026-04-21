import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCreateStorage } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'CreateStorage'>;
  route: RouteProp<FridgeStackParamList, 'CreateStorage'>;
};

const EMOJI_OPTIONS = ['🧊', '❄️', '🧺', '📦', '🥶', '🫙', '🍱', '🌡️'];

export default function CreateStorageScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧊');
  const createStorage = useCreateStorage(householdId);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do compartimento.');
      return;
    }
    try {
      await createStorage.mutateAsync({ name: name.trim(), emoji });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o compartimento.');
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Freezer, Isopor, Despensa…"
        placeholderTextColor={Colors.textSecondary}
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="done"
      />

      <Text style={styles.label}>Ícone</Text>
      <View style={styles.emojiRow}>
        {EMOJI_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiChip, emoji === e && styles.emojiChipActive]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={createStorage.isPending}>
        {createStorage.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Criar compartimento</Text>
        }
      </TouchableOpacity>
    </ScrollView>
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
  emojiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emojiChip: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiChipActive: { borderColor: Colors.accent, borderWidth: 2, backgroundColor: '#e8f0fe' },
  emojiText: { fontSize: 26 },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
