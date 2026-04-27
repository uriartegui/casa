import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useJoinHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'JoinHousehold'>;
  route: RouteProp<HouseholdStackParamList, 'JoinHousehold'>;
};

export default function JoinHouseholdScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(route.params?.initialCode ?? '');
  const joinHousehold = useJoinHousehold();

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('Erro', 'Digite o código de convite.');
      return;
    }
    try {
      const household = await joinHousehold.mutateAsync(code.trim());
      navigation.replace('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
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
          placeholder="00000"
          placeholderTextColor={Colors.textSecondary}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 5))}
          keyboardType="number-pad"
          maxLength={5}
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
    fontSize: 32, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
    textAlign: 'center', letterSpacing: 8,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
