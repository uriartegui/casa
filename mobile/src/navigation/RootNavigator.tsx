import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import { Colors } from '../constants/colors';

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthStack />;
}
