import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCreateStorage, useStorages } from '../../hooks/useStorages';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'CreateStorage'>;
  route: RouteProp<FridgeStackParamList, 'CreateStorage'>;
};

const PREDEFINED = [
  { name: 'Geladeira 2', emoji: '🧊' },
  { name: 'Freezer 2', emoji: '❄️' },
  { name: 'Despensa 2', emoji: '🏠' },
];

export default function CreateStorageScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: storages } = useStorages(householdId);
  const createStorage = useCreateStorage(householdId);

  const existingNames = new Set((storages ?? []).map((s) => s.name));
  const available = PREDEFINED.filter((p) => !existingNames.has(p.name));

  async function handleCreate(name: string, emoji: string) {
    try {
      await createStorage.mutateAsync({ name, emoji });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o compartimento.');
    }
  }

  if (available.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Todos os compartimentos já foram criados.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Escolha o compartimento a adicionar:</Text>
      <View style={styles.options}>
        {available.map((opt) => (
          <TouchableOpacity
            key={opt.name}
            style={styles.card}
            onPress={() => handleCreate(opt.name, opt.emoji)}
            disabled={createStorage.isPending}
          >
            <Text style={styles.cardEmoji}>{opt.emoji}</Text>
            <Text style={styles.cardName}>{opt.name}</Text>
            {createStorage.isPending && (
              <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: 8 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20, fontWeight: '500' },
  options: { gap: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: Colors.separator,
  },
  cardEmoji: { fontSize: 36 },
  cardName: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
});
