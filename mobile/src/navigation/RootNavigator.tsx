import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSelectedHouseholdSync } from '../context/SelectedHouseholdContext';
import { useHouseholds } from '../hooks/useHouseholds';
import { useHouseholdSync } from '../hooks/useHouseholdSync';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import HouseholdSetupScreen from '../screens/households/HouseholdSetupScreen';
import StorageCategoriesSetupScreen from '../screens/households/StorageCategoriesSetupScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { Colors } from '../constants/colors';

function AppGate() {
  const { data: households, isLoading, isError, refetch, isFetching } = useHouseholds();
  const [setupHouseholdId, setSetupHouseholdId] = useState<string | null>(null);
  useHouseholdSync(households);
  useSelectedHouseholdSync(households);

  if (isLoading || (!households && isFetching)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isError || !households) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
          Não consegui carregar suas casas
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
          Confira sua conexão e tente novamente. Sua conta não foi alterada.
        </Text>
        <TouchableOpacity
          style={{ minHeight: 48, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}
          onPress={() => refetch()}
          disabled={isFetching}
          activeOpacity={0.8}
        >
          {isFetching ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Tentar novamente</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  if (households.length === 0) {
    return <HouseholdSetupScreen onHouseholdCreated={(id) => setSetupHouseholdId(id)} />;
  }

  if (setupHouseholdId) {
    return (
      <StorageCategoriesSetupScreen
        householdId={setupHouseholdId}
        onDone={() => setSetupHouseholdId(null)}
      />
    );
  }

  return <AppTabs />;
}

export default function RootNavigator() {
  const { token, isLoading, hasSeenOnboarding, markOnboardingSeen } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!token) return <AuthStack />;
  if (!hasSeenOnboarding) return <OnboardingScreen onDone={markOnboardingSeen} />;
  return <AppGate />;
}
