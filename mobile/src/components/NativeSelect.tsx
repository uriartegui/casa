import React from 'react';
import { ActionSheetIOS, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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

  function openIOSSelector() {
    if (disabled) return;
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

  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity style={[styles.iosField, disabled && styles.disabled]} onPress={openIOSSelector} activeOpacity={disabled ? 1 : 0.75}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{selectedLabel}</Text>
        <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.androidField, disabled && styles.disabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <Picker selectedValue={value} onValueChange={(nextValue) => onChange(String(nextValue))} mode="dropdown" dropdownIconColor={Colors.textSecondary} style={styles.picker}>
        {!value && <Picker.Item label={placeholder} value="" enabled={false} color={Colors.textSecondary} />}
        {options.map((option) => <Picker.Item key={option.value} label={option.label} value={option.value} color={Colors.textPrimary} />)}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  iosField: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: Colors.separator, backgroundColor: Colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  androidField: { height: 54, borderRadius: 14, borderWidth: 1, borderColor: Colors.separator, backgroundColor: Colors.card, justifyContent: 'center' },
  picker: { height: 54, color: Colors.textPrimary },
  value: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  placeholder: { color: Colors.textSecondary, fontWeight: '500' },
  disabled: { opacity: 0.65 },
});
