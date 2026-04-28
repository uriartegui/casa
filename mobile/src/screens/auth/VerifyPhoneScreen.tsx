import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyPhone'>;
  route: RouteProp<AuthStackParamList, 'VerifyPhone'>;
};

export default function VerifyPhoneScreen({ navigation, route }: Props) {
  const { name, email, password, phone } = route.params;
  const { register } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('Erro', 'Digite o código de 6 dígitos.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { phone, code, type: 'register' });
      await register(name, email, password, phone);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Código inválido ou expirado.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      await api.post('/auth/send-otp', { phone, type: 'register' });
      Alert.alert('Código reenviado', `Novo código enviado para ${phone}.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível reenviar o código.');
    } finally {
      setIsResending(false);
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
          <Text style={styles.title}>Verificar telefone</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.codeInput}
            placeholder="Código SMS"
            placeholderTextColor={Colors.textSecondary}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Verificar e criar conta</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleResend} disabled={isResending}>
          <Text style={styles.link}>
            {isResending ? 'Reenviando...' : 'Não recebeu? '}
            {!isResending && <Text style={styles.linkAccent}>Reenviar código</Text>}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  backBtn: { marginBottom: 32 },
  backText: { color: Colors.accent, fontSize: 16, fontWeight: '500' },

  header: { marginBottom: 40 },
  title: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  phone: { fontWeight: '600', color: Colors.textPrimary },

  form: { gap: 16, marginBottom: 28 },
  codeInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.separator,
    letterSpacing: 8,
  },

  button: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
