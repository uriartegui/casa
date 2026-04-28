import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useHouseholds } from '../hooks/useHouseholds';
import { useHouseholdSync } from '../hooks/useHouseholdSync';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import HouseholdSetupScreen from '../screens/households/HouseholdSetupScreen';
import StorageCategoriesSetupScreen from '../screens/households/StorageCategoriesSetupScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { Colors } from '../constants/colors';

function AppGate() {
  const { data: households, isLoading } = useHouseholds();
  const [setupHouseholdId, setSetupHouseholdId] = useState<string | null>(null);
  useHouseholdSync(households);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!households || households.length === 0) {
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
