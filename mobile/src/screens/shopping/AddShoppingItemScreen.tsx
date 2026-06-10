import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableWithoutFeedback, Keyboard, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { filterItems, categoryFor } from '../../constants/commonItems';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAddListItem } from '../../hooks/useShoppingLists';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { Unit } from '../../types';

type Params = {
  householdId: string;
  listId?: string;
  prefillName?: string;
  prefillQuantity?: number;
  prefillUnit?: string;
};

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'AddShoppingItem'>;
  route: RouteProp<{ AddShoppingItem: Params }, 'AddShoppingItem'>;
};

const UNITS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

export default function AddShoppingItemScreen({ navigation, route }: Props) {
  const { householdId, listId, prefillName, prefillQuantity, prefillUnit } = route.params;
  const [name, setName] = useState(prefillName ?? '');
  const [nameFocused, setNameFocused] = useState(false);
  const suggestions = useMemo(() => filterItems(name), [name]);
  const [quantity, setQuantity] = useState(prefillQuantity ? String(prefillQuantity) : '1');
  const [unit, setUnit] = useState<Unit>((prefillUnit as Unit) ?? 'un');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const addItem = useAddListItem(householdId, listId ?? '');

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Câmera', 'Permita o acesso à câmera para escanear códigos de barras.');
        return;
      }
    }
    setScanned(false);
    setScannerOpen(true);
  }

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(result.data)}.json?fields=product_name,product_name_pt,quantity`,
      );
      const data = await response.json();
      const productName = data?.product?.product_name_pt || data?.product?.product_name;
      if (productName) {
        setName(productName);
        setScannerOpen(false);
        return;
      }
      Alert.alert('Produto não encontrado', 'Não encontrei esse código. Preencha o nome manualmente.');
      setScannerOpen(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível consultar o produto agora.');
      setScannerOpen(false);
    }
  }

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do item.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    try {
      const trimmedName = name.trim();
      await addItem.mutateAsync({
        name: trimmedName,
        quantity: qty,
        unit,
        category: categoryFor(trimmedName) ?? undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome do item</Text>
        <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
          <Text style={styles.scanButtonText}>Escanear código de barras</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ex: Leite"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setTimeout(() => setNameFocused(false), 150)}
          returnKeyType="next"
          autoCorrect={false}
          spellCheck={false}
        />
        {nameFocused && suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { setName(s); setNameFocused(false); Keyboard.dismiss(); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          placeholder="1"
          placeholderTextColor={Colors.textSecondary}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text style={styles.label}>Unidade</Text>
        <View style={styles.unitRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitChip, unit === u && styles.unitChipActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={addItem.isPending}>
          {addItem.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Adicionar à lista</Text>
          }
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scannerText}>Aponte para o código de barras</Text>
            <TouchableOpacity style={styles.closeScannerButton} onPress={() => setScannerOpen(false)}>
              <Text style={styles.closeScannerText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, padding: 14,
    fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.separator,
  },
  unitRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.separator },
  unitChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  unitChipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  unitChipTextActive: { color: '#fff' },
  scanButton: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.accent + '14',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  scanButtonText: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  suggestions: {
    backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.separator, overflow: 'hidden', marginTop: -6,
  },
  suggestionItem: {
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  suggestionText: { fontSize: 15, color: Colors.textPrimary },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  scannerText: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 18 },
  closeScannerButton: {
    position: 'absolute',
    bottom: 44,
    left: 24,
    right: 24,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  closeScannerText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
