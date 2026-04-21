import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.destructiveButton} onPress={handleLogout}>
          <Text style={styles.destructiveButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  avatarContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 15, color: Colors.textSecondary },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  destructiveButton: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.destructive,
  },
  destructiveButtonText: { color: Colors.destructive, fontSize: 16, fontWeight: '600' },
});
