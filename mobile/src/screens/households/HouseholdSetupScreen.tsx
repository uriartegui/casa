import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Linking } from 'react-native';
import { useCreateHousehold, useJoinHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';

type Mode = 'pick' | 'create' | 'join';

function extractInviteCode(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/^casa:\/\/join\/(.+)$/);
  return match ? match[1] : null;
}

export default function HouseholdSetupScreen() {
  const [mode, setMode] = useState<Mode>('pick');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const inviteCode = extractInviteCode(url);
      if (inviteCode) {
        setCode(inviteCode);
        setMode('join');
      }
    });
  }, []);
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para a casa.');
      return;
    }
    try {
      await createHousehold.mutateAsync(name.trim());
      // RootNavigator re-renders automatically when useHouseholds returns data
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a casa.');
    }
  }

  async function handleJoin() {
    if (code.length < 5) {
      Alert.alert('Erro', 'Digite o código de convite de 5 dígitos.');
      return;
    }
    try {
      await joinHousehold.mutateAsync(code);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  if (mode === 'pick') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={styles.title}>Bem-vindo ao casa</Text>
          <Text style={styles.subtitle}>Para começar, crie uma casa ou entre em uma existente com um código de convite.</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={() => setMode('create')}>
              <Text style={styles.buttonText}>Criar nova casa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setMode('join')}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Entrar com código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => setMode('pick')}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        {mode === 'create' ? (
          <>
            <Text style={styles.title}>Nova casa</Text>
            <Text style={styles.label}>Nome da casa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Casa dos Uriarte"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={createHousehold.isPending}>
              {createHousehold.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Criar casa</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Entrar com código</Text>
            <Text style={styles.label}>Código de convite</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="00000"
              placeholderTextColor={Colors.textSecondary}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad"
              maxLength={5}
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />
            <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joinHousehold.isPending}>
              {joinHousehold.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Entrar na casa</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator, marginBottom: 16,
  },
  codeInput: {
    fontSize: 32, textAlign: 'center', letterSpacing: 8,
  },
  actions: { gap: 12 },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: Colors.accent },
  back: { marginBottom: 24 },
  backText: { color: Colors.accent, fontSize: 16, fontWeight: '500' },
});
