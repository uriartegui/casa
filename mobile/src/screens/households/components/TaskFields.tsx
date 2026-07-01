import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import NativeSelect from '../../../components/NativeSelect';
import { Colors } from '../../../constants/colors';
import { formatBrShortDate } from '../../../utils/dateUtils';
import { Typography } from '../../../theme/typography';

type DropdownOption = { label: string; value: string };

export function DropdownField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.sheetLabel}>{label}</Text>
      <NativeSelect value={value} options={options} onChange={onChange} />
    </View>
  );
}

export function DateField({ value, onPress, onClear }: { value: string | null; onPress: () => void; onClear: () => void }) {
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.sheetLabel}>Prazo</Text>
      <View style={styles.dateRowWrap}>
        <TouchableOpacity style={[styles.selectRow, styles.dateRow]} onPress={onPress} activeOpacity={0.75}>
          <Text style={styles.selectValue}>{value ? formatBrShortDate(value) : 'Sem prazo'}</Text>
          <Feather name="calendar" size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
        {!!value && <TouchableOpacity onPress={onClear} style={styles.clearDateButton}><Text style={styles.clearDateText}>Limpar</Text></TouchableOpacity>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownField: { gap: 5, position: 'relative' },
  sheetLabel: { fontFamily: Typography.title, fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginTop: 8 },
  selectRow: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectValue: { fontFamily: Typography.rounded, flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  dateRowWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateRow: { flex: 1 },
  clearDateButton: { paddingHorizontal: 4, paddingVertical: 8 },
  clearDateText: { fontFamily: Typography.title, color: Colors.destructive, fontSize: 12, fontWeight: '700' },
});
