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
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SelectedHouseholdProvider } from './src/context/SelectedHouseholdContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';
import { api } from './src/services/api';

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
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.setNotificationCategoryAsync('fridge-empty', [
      {
        identifier: 'add-to-list',
        buttonTitle: 'Adicionar à lista',
        options: { opensAppToForeground: true },
      },
    ]);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier !== 'add-to-list') return;

      const data = response.notification.request.content.data as {
        type?: string;
        householdId?: string;
        itemName?: string;
        quantity?: number;
        unit?: string;
        category?: string;
      };

      if (data.type !== 'fridge-empty' || !data.householdId || !data.itemName) return;

      api.post(`/households/${data.householdId}/shopping-items/restock`, {
        name: data.itemName,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? 'un',
        category: data.category,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', data.householdId] });
        queryClient.invalidateQueries({ queryKey: ['shopping-activity', data.householdId] });
      }).catch((err) => {
        console.warn('[Push action] Não foi possível adicionar item à lista:', err?.message ?? err);
      });
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SelectedHouseholdProvider>
              <ToastProvider>
                <NavigationContainer linking={linking}>
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
