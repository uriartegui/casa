import React, { useEffect, useState } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(value);

  useEffect(() => {
    if (visible) setSelectedDate(value);
  }, [value, visible]);

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={selectedDate}
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
        value={selectedDate}
        mode="date"
        display="inline"
        minimumDate={new Date()}
        themeVariant="light"
        style={styles.calendar}
        onChange={(_, date) => {
          if (date) setSelectedDate(date);
        }}
      />
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => {
          onChange(selectedDate);
          onClose();
        }}
      >
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
  calendar: {
    alignSelf: 'stretch',
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
