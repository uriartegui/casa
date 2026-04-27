import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api';

const PROJECT_ID = '1bbc4256-057a-4b26-895a-9ba95934e86c';

type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'not-device' | 'permission-denied' | 'token-error' | 'api-error'; detail?: string };

export async function registerPushToken(): Promise<PushTokenResult> {
  if (!Device.isDevice && !__DEV__) {
    console.log('[Push] Pulando: não é device físico e não está em __DEV__');
    return { ok: false, reason: 'not-device' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[Push] Permissão atual:', existingStatus);

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Push] Permissão após request:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permissão negada');
    return { ok: false, reason: 'permission-denied' };
  }

  let tokenData: Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>;
  try {
    tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    console.log('[Push] Token obtido:', tokenData.data);
  } catch (err: any) {
    console.error('[Push] Erro ao obter token:', err?.message ?? err);
    return { ok: false, reason: 'token-error', detail: err?.message };
  }

  try {
    await api.patch('/users/me/push-token', { pushToken: tokenData.data });
    console.log('[Push] Token salvo no backend com sucesso');
    return { ok: true, token: tokenData.data };
  } catch (err: any) {
    console.error('[Push] Erro ao salvar token no backend:', err?.message ?? err);
    return { ok: false, reason: 'api-error', detail: err?.message };
  }
}
