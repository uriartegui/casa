import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export default function DatePickerField({ visible, value, onChange, onClose }: Props) {
  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        minimumDate={new Date()}
        onChange={(event, date) => {
          onClose();
          if (event.type === 'set' && date) onChange(date);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        minimumDate={new Date()}
        style={styles.spinner}
        onChange={(_, date) => {
          if (date) onChange(date);
        }}
      />
      <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
        <Text style={styles.doneBtnText}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: 'hidden',
    marginTop: 4,
  },
  spinner: {
    height: 180,
  },
  doneBtn: {
    backgroundColor: Colors.accent,
    padding: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
