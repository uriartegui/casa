import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCreateStorage } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { Typography } from '../../theme/typography';

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>NOME</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Banheiro, Limpeza, Adega..."
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120, gap: 12 },

  sectionLabel: {
    fontFamily: Typography.title,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.separator,
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: Typography.body,
    fontSize: 16, color: Colors.textPrimary,
    paddingVertical: 13, minHeight: 56,
  },

  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 16,
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
    marginTop: 12,
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.separator,
  },
  previewEmoji: { fontSize: 32 },
  previewName: { fontFamily: Typography.rounded, fontSize: 17, fontWeight: '700', color: Colors.textPrimary, flex: 1 },

  createBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent, borderRadius: 16,
    minHeight: 52, alignItems: 'center', justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '800' },
});
