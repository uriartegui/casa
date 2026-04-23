import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Alert, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { RouteProp } from '@react-navigation/native';
import { useInviteCode } from '../../hooks/useHouseholds';
import { Colors } from '../../constants/colors';
import { HouseholdStackParamList } from '../../navigation/AppTabs';

type Props = {
  route: RouteProp<HouseholdStackParamList, 'Invite'>;
};

export default function InviteScreen({ route }: Props) {
  const { householdId } = route.params;
  const { data, isLoading, isError } = useInviteCode(householdId);
  const inviteCode = data?.inviteCode ?? '';

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copiado!', 'Código copiado para a área de transferência.');
  }, [inviteCode]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Entre na minha casa no app Casa com o código: ${inviteCode}`,
        title: 'Convite para casa',
      });
    } catch {
      // user dismissed
    }
  }, [inviteCode]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isError || !inviteCode) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Não foi possível carregar o código.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>CÓDIGO DE CONVITE</Text>
        <Text style={styles.code}>
          {inviteCode.slice(0, 3)} {inviteCode.slice(3)}
        </Text>
        <Text style={styles.expiry}>Válido por 2 horas</Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode value={inviteCode} size={180} color={Colors.textPrimary} backgroundColor={Colors.card} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleCopy}>
          <Text style={styles.buttonText}>Copiar código</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleShare}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Compartilhar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, gap: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.separator,
  },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  code: {
    fontSize: 42, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 8,
  },
  expiry: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  qrContainer: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.separator },
  actions: { gap: 10 },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accent },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: Colors.accent },
});
