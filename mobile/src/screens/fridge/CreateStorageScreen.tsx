import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
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

const EMOJI_OPTIONS = ['🧊', '❄️', '🏠', '🍎', '🥦', '🍖', '🧀', '🥛', '🍺', '🫙', '📦', '🗄️'];

export default function CreateStorageScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const createStorage = useCreateStorage(householdId);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧊');

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nome obrigatório', 'Digite um nome para o compartimento.');
      return;
    }
    try {
      await createStorage.mutateAsync({ name: trimmed, emoji });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Não foi possível criar o compartimento.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>NOME</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Geladeira da cozinha, Adega..."
          placeholderTextColor={Colors.textSecondary}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleCreate}
          maxLength={40}
        />
      </View>

      <Text style={styles.sectionLabel}>EMOJI</Text>
      <View style={styles.emojiGrid}>
        {EMOJI_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiBtn, e === emoji && styles.emojiBtnActive]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewEmoji}>{emoji}</Text>
        <Text style={styles.previewName}>{name.trim() || 'Nome do compartimento'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.createBtn, createStorage.isPending && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={createStorage.isPending}
      >
        {createStorage.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.createBtnText}>Criar compartimento</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    letterSpacing: 0.6, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  card: {
    backgroundColor: Colors.card, marginHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.separator,
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16, color: Colors.textPrimary,
    paddingVertical: 14, minHeight: 52,
  },

  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16,
  },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator,
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBtnActive: {
    borderColor: Colors.accent, borderWidth: 2,
    backgroundColor: Colors.accent + '18',
  },
  emojiText: { fontSize: 26 },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.separator,
  },
  previewEmoji: { fontSize: 32 },
  previewName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, flex: 1 },

  createBtn: {
    margin: 16, marginTop: 24,
    backgroundColor: Colors.accent, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
