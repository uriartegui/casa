import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Alert, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useInviteCode } from '../../hooks/useHouseholds';
import { useCreateShoppingList } from '../../hooks/useShoppingLists';
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
  const createShoppingList = useCreateShoppingList(householdId);
  const { data: inviteData } = useInviteCode(householdId);
  const inviteCode = inviteData?.inviteCode ?? '';
  const inviteLink = inviteCode ? `${API_URL}/invite/${inviteCode}` : '';
  const [firstListName, setFirstListName] = React.useState('Compras da casa');
  const [firstListPlace, setFirstListPlace] = React.useState('');

  const orderedStorages = React.useMemo(() => {
    return [...(storages ?? [])].sort((a, b) => {
      const rankA = ORDER_RANK.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const rankB = ORDER_RANK.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [storages]);

  const visibleCount = orderedStorages.filter((storage) => !storage.hidden).length;
  const completedSteps = visibleCount > 0 ? 1 : 0;

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

  async function createFirstList() {
    const name = firstListName.trim();
    if (!name) {
      Alert.alert('Nome da lista', 'Digite um nome para a primeira lista.');
      return;
    }

    try {
      await createShoppingList.mutateAsync({
        name,
        place: firstListPlace.trim() || undefined,
      });
      onDone();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel criar a primeira lista.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Primeiro ganho</Text>
        <Text style={styles.title}>Comece pela lista</Text>
        <Text style={styles.subtitle}>
          Crie uma lista compartilhada agora. Estoque, validade e tarefas entram depois, quando fizer sentido.
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedSteps / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedSteps}/3 passos iniciados</Text>
        </View>

        <View style={[styles.card, styles.primaryCard]}>
          <Text style={styles.cardTitle}>1. Crie a primeira lista</Text>
          <Text style={styles.cardText}>Use como usaria no WhatsApp, mas com marcar comprado, compartilhar e guardar depois.</Text>

          <TextInput
            style={styles.input}
            value={firstListName}
            onChangeText={setFirstListName}
            placeholder="Ex: Mercado da semana"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            value={firstListPlace}
            onChangeText={setFirstListPlace}
            placeholder="Lugar opcional: mercado, farmacia..."
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
            onSubmitEditing={createFirstList}
          />

          <TouchableOpacity style={styles.doneButton} onPress={createFirstList} disabled={createShoppingList.isPending}>
            {createShoppingList.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.doneButtonText}>Criar lista e entrar</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>2. Ajuste os estoques</Text>
              <Text style={styles.cardText}>Deixe visivel so o que sua casa usa. Voce pode mudar depois.</Text>
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
          <Text style={styles.cardTitle}>3. Convide quem mora junto</Text>
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

        <TouchableOpacity style={styles.skipButton} onPress={onDone}>
          <Text style={styles.skipButtonText}>Entrar sem criar lista agora</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 26 },
  eyebrow: { fontFamily: Typography.title, fontSize: 12, fontWeight: '800', color: Colors.accent, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: Typography.title, fontSize: 27, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontFamily: Typography.body, fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 18 },
  progressWrap: { gap: 8, marginBottom: 16 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: Colors.separator, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: Colors.accent },
  progressText: { fontFamily: Typography.title, fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 17,
    marginBottom: 12,
    gap: 12,
  },
  primaryCard: { borderColor: Colors.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontFamily: Typography.title, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardText: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
  },
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
    borderRadius: 16,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontFamily: Typography.title, fontSize: 14, color: Colors.accent, fontWeight: '700' },
  doneButton: { backgroundColor: Colors.accent, borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '800' },
  skipButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  skipButtonText: { fontFamily: Typography.title, color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
