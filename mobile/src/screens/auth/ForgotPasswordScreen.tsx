import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      Alert.alert('Erro', 'Digite um telefone válido com DDD.');
      return;
    }
    const formattedPhone = `+55${digitsOnly}`;

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone: formattedPhone });
      navigation.navigate('ResetPassword', { phone: formattedPhone });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao enviar código.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Esqueci a senha</Text>
          <Text style={styles.subtitle}>
            Digite seu telefone cadastrado. Vamos enviar um código para redefinir sua senha.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor={Colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.button} onPress={handleSend} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Enviar código</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  backBtn: { marginBottom: 32 },
  backText: { color: Colors.accent, fontSize: 16, fontWeight: '500' },

  header: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },

  form: { gap: 12 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
  },

  button: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
