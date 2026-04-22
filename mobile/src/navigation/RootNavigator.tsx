import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useHouseholds } from '../hooks/useHouseholds';
import { useHouseholdSync } from '../hooks/useHouseholdSync';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import HouseholdSetupScreen from '../screens/households/HouseholdSetupScreen';
import { Colors } from '../constants/colors';

function AppGate() {
  const { data: households, isLoading } = useHouseholds();
  useHouseholdSync(households);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!households || households.length === 0) {
    return <HouseholdSetupScreen />;
  }

  return <AppTabs />;
}

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return token ? <AppGate /> : <AuthStack />;
}
