import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

type LoadErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
};

export function LoadErrorState({
  title = 'Não consegui carregar os dados',
  message = 'Confira sua conexão e tente novamente.',
  actionLabel = 'Tentar novamente',
  isRetrying = false,
  onRetry,
}: LoadErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          {isRetrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{actionLabel}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
