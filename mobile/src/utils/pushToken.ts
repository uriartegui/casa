import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api';

const PROJECT_ID = '1bbc4256-057a-4b26-895a-9ba95934e86c';

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice && !__DEV__) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });

  await api.patch('/users/me/push-token', { pushToken: tokenData.data }).catch(() => {});
}
