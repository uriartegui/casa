import React, { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useJoinHousehold } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';
import { Typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HouseholdStackParamList, 'JoinHousehold'>;
  route: RouteProp<HouseholdStackParamList, 'JoinHousehold'>;
};

export default function JoinHouseholdScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(route.params?.initialCode ?? '');
  const joinHousehold = useJoinHousehold();
  const { setSelectedHouseholdId } = useSelectedHousehold();

  async function handleJoin() {
    if (!code.trim()) {
      Alert.alert('Erro', 'Digite o código de convite.');
      return;
    }
    try {
      const household = await joinHousehold.mutateAsync(code.trim());
      setSelectedHouseholdId(household.id);
      navigation.replace('HouseholdDetail', { householdId: household.id, householdName: household.name });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Código de convite</Text>
        <TextInput
          style={styles.input}
          placeholder="Código de convite"
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
    fontFamily: Typography.display, fontSize: 32, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    textAlign: 'center', letterSpacing: 8,
  },
  button: { backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
});
