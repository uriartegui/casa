import React from 'react';
import { ActionSheetIOS, NativeModules, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export type NativeSelectOption = { label: string; value: string };

type Props = {
  value: string;
  options: NativeSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function NativeSelect({ value, options, placeholder = 'Selecionar', disabled = false, onChange }: Props) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;
  const isDisabled = disabled || options.length === 0;

  function openIOSSelector() {
    if (isDisabled) return;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...options.map((option) => option.label), 'Cancelar'],
        cancelButtonIndex: options.length,
        userInterfaceStyle: 'light',
      },
      (index) => {
        if (index < options.length) onChange(options[index].value);
      },
    );
  }

  function openAndroidSelector() {
    if (isDisabled) return;

    const dialogManager = NativeModules.DialogManagerAndroid;
    if (!dialogManager) return;

    dialogManager.showAlert(
      {
        title: placeholder,
        items: options.map((option) => option.label),
        cancelable: true,
      },
      () => undefined,
      (action: string, index?: number) => {
        if (action === 'buttonClicked' && typeof index === 'number' && index >= 0 && index < options.length) {
          onChange(options[index].value);
        }
      },
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity style={[styles.field, isDisabled && styles.disabled]} onPress={openIOSSelector} activeOpacity={isDisabled ? 1 : 0.75}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{selectedLabel}</Text>
        <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.field, isDisabled && styles.disabled]} onPress={openAndroidSelector} activeOpacity={isDisabled ? 1 : 0.75}>
      <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{selectedLabel}</Text>
      <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: Colors.separator, backgroundColor: Colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  value: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  placeholder: { color: Colors.textSecondary, fontWeight: '500' },
  disabled: { opacity: 0.65 },
});
