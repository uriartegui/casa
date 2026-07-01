import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useInviteCode } from '../../hooks/useHouseholds';
import { useStorages, useUpdateStorage } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { API_URL } from '../../config';
import { Typography } from '../../theme/typography';

type Props = {
  householdId: string;
  onDone: () => void;
};

const DEFAULT_ORDER = ['Geladeira', 'Freezer', 'Despensa', 'Limpeza', 'Banheiro', 'Lavanderia'];
const ORDER_RANK = new Map(DEFAULT_ORDER.map((name, index) => [name.toLowerCase(), index]));

export default function StorageCategoriesSetupScreen({ householdId, onDone }: Props) {
  const { data: storages, isLoading } = useStorages(householdId, { includeHidden: true });
  const updateStorage = useUpdateStorage(householdId);
  const { data: inviteData } = useInviteCode(householdId);
  const inviteCode = inviteData?.inviteCode ?? '';
  const inviteLink = inviteCode ? `${API_URL}/invite/${inviteCode}` : '';

  const orderedStorages = React.useMemo(() => {
    return [...(storages ?? [])].sort((a, b) => {
      const rankA = ORDER_RANK.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rankB = ORDER_RANK.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [storages]);

  const visibleCount = orderedStorages.filter((storage) => !storage.hidden).length;
  const completedSteps = 1 + (visibleCount > 0 ? 1 : 0);

  async function toggleStorage(storageId: string, hidden: boolean) {
    if (!hidden && visibleCount <= 1) {
      Alert.alert('Mantenha um estoque', 'A casa precisa ter pelo menos um estoque visível.');
      return;
    }
    await updateStorage.mutateAsync({ storageId, hidden: !hidden });
  }

  async function shareInvite() {
    if (!inviteLink) return;
    await Share.share({
      title: 'Convite para o Colmeia',
      message: `Entre na minha casa no Colmeia: ${inviteLink}`,
    });
  }

  async function copyInvite() {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Copiado', 'Link de convite copiado.');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Primeiros passos</Text>
        <Text style={styles.title}>Deixe sua casa pronta</Text>
        <Text style={styles.subtitle}>
          Configure o básico agora. O resto você pode ajustar depois pela aba Casa.
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedSteps / 4) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedSteps}/4 passos iniciados</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>1. Escolha os estoques</Text>
              <Text style={styles.cardText}>Deixe visível só o que sua casa usa.</Text>
            </View>
            {isLoading && <ActivityIndicator size="small" color={Colors.accent} />}
          </View>

          <View style={styles.storageGrid}>
            {orderedStorages.map((storage) => {
              const active = !storage.hidden;
              return (
                <TouchableOpacity
                  key={storage.id}
                  style={[styles.storageChip, active && styles.storageChipActive]}
                  onPress={() => toggleStorage(storage.id, storage.hidden)}
                  disabled={updateStorage.isPending}
                >
                  <Text style={[styles.storageText, active && styles.storageTextActive]}>{storage.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Convide quem mora junto</Text>
          <Text style={styles.cardText}>A casa funciona melhor quando todo mundo consegue atualizar estoque e lista.</Text>
          <View style={styles.inviteBox}>
            <Text style={styles.inviteLabel}>Código</Text>
            <Text style={styles.inviteCode}>{inviteCode ? `${inviteCode.slice(0, 3)} ${inviteCode.slice(3)}` : '...'}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={copyInvite} disabled={!inviteLink}>
              <Text style={styles.secondaryButtonText}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={shareInvite} disabled={!inviteLink}>
              <Text style={styles.secondaryButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Adicione seus primeiros itens</Text>
          <Text style={styles.cardText}>Comece com 3 itens que você sempre quer lembrar: leite, sabão, papel, shampoo...</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Crie sua primeira lista</Text>
          <Text style={styles.cardText}>Quando algo acabar no estoque, mande para a lista e a casa inteira acompanha.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Entrar na casa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  eyebrow: { fontFamily: Typography.title, fontSize: 12, fontWeight: '800', color: Colors.accent, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: Typography.title, fontSize: 27, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontFamily: Typography.body, fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 18 },
  progressWrap: { gap: 8, marginBottom: 16 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: Colors.separator, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: Colors.accent },
  progressText: { fontFamily: Typography.title, fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontFamily: Typography.title, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardText: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  storageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  storageChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  storageText: { fontFamily: Typography.rounded, fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  storageTextActive: { color: '#fff' },
  inviteBox: {
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 14,
    alignItems: 'center',
  },
  inviteLabel: { fontFamily: Typography.title, fontSize: 11, color: Colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  inviteCode: { fontFamily: Typography.title, fontSize: 30, color: Colors.textPrimary, fontWeight: '800', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontFamily: Typography.title, fontSize: 14, color: Colors.accent, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  doneButton: { backgroundColor: Colors.accent, borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '700' },
});
