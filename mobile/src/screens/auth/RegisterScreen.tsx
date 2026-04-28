import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleNext() {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      Alert.alert('Erro', 'Telefone inválido.');
      return;
    }
    const formattedPhone = `+55${digitsOnly}`;

    setIsLoading(true);
    try {
      await register(name.trim(), password, formattedPhone);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro ao criar conta.';
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
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Junte-se à sua família no Colmeia</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Como você se chama"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor={Colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="go"
              onSubmitEditing={handleNext}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Continuar</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tem conta? <Text style={styles.linkAccent}>Entrar</Text></Text>
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

  header: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },

  form: { gap: 12, marginBottom: 28 },
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  eyeBtn: { paddingLeft: 8 },
  eyeIcon: { fontSize: 18 },

  button: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  link: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
