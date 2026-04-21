import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useJoinHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'JoinHousehold'>;
};

export default function JoinHouseholdScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const joinHousehold = useJoinHousehold();

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('Erro', 'Digite o código de convite.');
      return;
    }
    try {
      const household = await joinHousehold.mutateAsync(code.trim());
      navigation.replace('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch {
      Alert.alert('Erro', 'Código inválido ou expirado.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.label}>Código de convite</Text>
        <TextInput
          style={styles.input}
          placeholder="Cole o código aqui"
          placeholderTextColor={Colors.textSecondary}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleJoin}
        />
        <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joinHousehold.isPending}>
          {joinHousehold.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Entrar na casa</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
