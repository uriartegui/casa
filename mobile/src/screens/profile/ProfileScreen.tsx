import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const avatarInitial = (user?.name ?? '?')[0].toUpperCase();

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) {
      setEditingName(false);
      setNameValue(user?.name ?? '');
      return;
    }
    setSavingName(true);
    try {
      const { data } = await api.patch('/users/me', { name: trimmed });
      updateUser({ name: data.name });
      setEditingName(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao salvar nome.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Erro', 'Preencha os dois campos.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'Nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/users/me', { currentPassword, newPassword });
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao alterar senha.';
      Alert.alert('Erro', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <Text style={styles.displayName}>{user?.name}</Text>
          <Text style={styles.displayEmail}>{user?.email}</Text>
        </View>

        {/* Conta */}
        <Text style={styles.sectionLabel}>CONTA</Text>
        <View style={styles.card}>
          {/* Nome */}
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.inlineInput}
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                placeholder="Seu nome"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.inlineSaveBtn}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName
                  ? <ActivityIndicator size="small" color={Colors.accent} />
                  : <Text style={styles.inlineSaveText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setNameValue(user?.name ?? '');
                setEditingName(true);
              }}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Nome</Text>
                <Text style={styles.rowValue}>{user?.name}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* E-mail (somente leitura) */}
          <View style={[styles.row, styles.rowDisabled]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>E-mail</Text>
              <Text style={styles.rowValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Segurança */}
        <Text style={styles.sectionLabel}>SEGURANÇA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => setPasswordModal(true)}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Senha</Text>
              <Text style={styles.rowValue}>Alterar senha</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Perigo */}
        <Text style={styles.sectionLabel}>SESSÃO</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={styles.destructiveLabel}>Sair da conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal trocar senha */}
      <Modal
        visible={passwordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
              }}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Trocar senha</Text>
              <TouchableOpacity onPress={handleSavePassword} disabled={savingPassword}>
                {savingPassword
                  ? <ActivityIndicator size="small" color={Colors.accent} />
                  : <Text style={styles.modalSave}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.card}>
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordRowLabel}>Senha atual</Text>
                  <View style={styles.passwordRowRight}>
                    <TextInput
                      style={styles.passwordRowInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrent}
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => setShowCurrent(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.eyeIcon}>{showCurrent ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.passwordRow}>
                  <Text style={styles.passwordRowLabel}>Nova senha</Text>
                  <View style={styles.passwordRowRight}>
                    <TextInput
                      style={styles.passwordRowInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNew}
                      returnKeyType="done"
                      onSubmitEditing={handleSavePassword}
                    />
                    <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.modalHint}>A nova senha deve ter pelo menos 6 caracteres.</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  displayName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  displayEmail: { fontSize: 14, color: Colors.textSecondary },

  // Section
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    letterSpacing: 0.6, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.separator,
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 56,
  },
  rowDisabled: { opacity: 0.6 },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  rowValue: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  chevron: { fontSize: 22, color: Colors.textSecondary, marginLeft: 8, lineHeight: 26 },
  divider: { height: 1, backgroundColor: Colors.separator, marginLeft: 16 },

  // Inline edit
  editRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, minHeight: 56,
  },
  inlineInput: {
    flex: 1, fontSize: 16, color: Colors.textPrimary,
    borderBottomWidth: 2, borderBottomColor: Colors.accent,
    paddingVertical: 4, marginRight: 12,
  },
  inlineSaveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  inlineSaveText: { color: Colors.accent, fontWeight: '700', fontSize: 15 },

  // Destructive
  destructiveLabel: { fontSize: 16, color: Colors.destructive, fontWeight: '500' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
    backgroundColor: Colors.card,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalCancel: { fontSize: 16, color: Colors.textSecondary },
  modalSave: { fontSize: 16, color: Colors.accent, fontWeight: '700' },
  modalBody: { padding: 20 },
  modalHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 12, paddingHorizontal: 4 },

  // Password rows inside modal
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 56,
  },
  passwordRowLabel: { fontSize: 15, color: Colors.textPrimary, width: 110 },
  passwordRowRight: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  passwordRowInput: {
    flex: 1, fontSize: 16, color: Colors.textPrimary, textAlign: 'right',
  },
  eyeIcon: { fontSize: 16, marginLeft: 8 },
});
