import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

function toDisplayString(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseInput(text: string): { date: Date; expired: boolean } | null {
  const digits = text.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10) - 1;
  const year = parseInt(digits.slice(4, 8), 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return { date, expired: date < today };
}

export default function DateField({ value, onChange }: Props) {
  const [text, setText] = useState(value ? toDisplayString(value) : '');
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!value) { setText(''); setError(false); setExpired(false); }
  }, [value]);

  function handleChange(raw: string) {
    const masked = applyMask(raw);
    setText(masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 0) {
      setError(false); setExpired(false);
      onChange(null);
    } else if (digits.length === 8) {
      const parsed = parseInput(masked);
      setError(!parsed);
      setExpired(parsed?.expired ?? false);
      onChange(parsed?.date ?? null);
    } else {
      setError(false); setExpired(false);
      onChange(null);
    }
  }

  function handleClear() {
    setText('');
    setError(false);
    onChange(null);
  }

  return (
    <View>
      <View style={[styles.row, error && styles.rowError]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="number-pad"
          maxLength={10}
          returnKeyType="done"
        />
        {text.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>Data inválida</Text>}
      {!error && expired && <Text style={styles.warnText}>Item já vencido — será marcado como vencido</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.separator,
    flexDirection: 'row', alignItems: 'center',
  },
  rowError: { borderColor: Colors.destructive },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 12 },
  clear: { fontSize: 16, color: Colors.textSecondary, paddingLeft: 8 },
  errorText: { fontSize: 12, color: Colors.destructive, marginTop: 4, marginLeft: 4 },
  warnText: { fontSize: 12, color: '#F59E0B', marginTop: 4, marginLeft: 4 },
});
