import 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Sentry.init({
  dsn: 'https://a7512efd0839a511b22e64652111bbe7@o4511077727010816.ingest.us.sentry.io/4511290419511296',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SelectedHouseholdProvider } from './src/context/SelectedHouseholdContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';
import { useKeepAlive } from './src/hooks/useKeepAlive';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: LinkingOptions<any> = {
  prefixes: ['colmeia://'],
  config: {
    screens: {
      ColmeiaTab: {
        screens: {
          JoinHousehold: 'join/:initialCode',
        },
      },
    },
  },
};

function App() {
  useKeepAlive();

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SelectedHouseholdProvider>
              <ToastProvider>
                <NavigationContainer linking={linking}>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </SelectedHouseholdProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
