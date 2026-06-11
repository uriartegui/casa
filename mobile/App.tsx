import 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import React, { useEffect, useRef } from 'react';
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
import { createNavigationContainerRef, NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SelectedHouseholdProvider } from './src/context/SelectedHouseholdContext';
import { useSelectedHousehold } from './src/context/SelectedHouseholdContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigationRef = createNavigationContainerRef<any>();

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

type PushData = {
  type?: string;
  householdId?: string;
  itemId?: string;
};

function NotificationResponseHandler() {
  const { setSelectedHouseholdId } = useSelectedHousehold();
  const pendingExpirationRef = useRef<{ householdId: string; itemId: string } | null>(null);

  function navigateToExpirationItem(householdId: string, itemId: string) {
    setSelectedHouseholdId(householdId);

    if (!navigationRef.isReady()) {
      pendingExpirationRef.current = { householdId, itemId };
      return;
    }

    navigationRef.navigate('GeladeirTab', {
      screen: 'FridgeItemDetail',
      params: { householdId, itemId },
    });
  }

  function flushPendingExpiration() {
    const pending = pendingExpirationRef.current;
    if (!pending || !navigationRef.isReady()) return;

    pendingExpirationRef.current = null;
    navigateToExpirationItem(pending.householdId, pending.itemId);
  }

  function handleNotificationResponse(response: Notifications.NotificationResponse | null) {
    if (!response) return;

    const data = response.notification.request.content.data as PushData;

    if (data.type === 'expiration' && data.householdId && data.itemId) {
      navigateToExpirationItem(data.householdId, data.itemId);
    }
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse).catch(() => {});

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(flushPendingExpiration, 0);
    return () => clearTimeout(timeout);
  });

  return null;
}

function App() {
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
                <NotificationResponseHandler />
                <NavigationContainer ref={navigationRef} linking={linking}>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={{ flex: 1 }}>
                      <StatusBar style="auto" />
                      <RootNavigator />
                    </View>
                  </TouchableWithoutFeedback>
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
