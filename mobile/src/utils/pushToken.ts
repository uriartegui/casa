import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
const NOTIFICATION_SOUND = 'colmeia_chime.wav';
const DEVICE_ID_KEY = '@colmeia:push-device-id';

type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'not-device' | 'permission-denied' | 'token-error' | 'api-error'; detail?: string };

function warnPush(message: string, detail?: unknown) {
  if (!__DEV__) return;
  if (detail === undefined) console.warn(message);
  else console.warn(message, detail);
}

function errorPush(message: string, detail?: unknown) {
  if (!__DEV__) return;
  if (detail === undefined) console.error(message);
  else console.error(message, detail);
}

function createLocalDeviceId() {
  const random = Math.random().toString(36).slice(2);
  return `${Platform.OS}-${Date.now().toString(36)}-${random}`;
}

async function getPushDeviceId() {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const next = createLocalDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

async function getPushDevicePayload() {
  return {
    deviceId: await getPushDeviceId(),
    platform: Platform.OS,
  };
}

export async function registerPushToken(): Promise<PushTokenResult> {
  if (!Device.isDevice && !__DEV__) {
    return { ok: false, reason: 'not-device' };
  }

  if (!PROJECT_ID) {
    errorPush('[Push] Project ID do EAS não encontrado.');
    return { ok: false, reason: 'token-error', detail: 'missing-project-id' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('colmeia', {
      name: 'Colmeia',
      importance: Notifications.AndroidImportance.MAX,
      sound: NOTIFICATION_SOUND,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    warnPush('[Push] Permissão negada');
    return { ok: false, reason: 'permission-denied' };
  }

  let tokenData: Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>;
  try {
    tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
  } catch (err: any) {
    errorPush('[Push] Erro ao obter token:', err?.message ?? err);
    return { ok: false, reason: 'token-error', detail: err?.message };
  }

  try {
    await api.patch('/users/me/push-token', {
      pushToken: tokenData.data,
      ...(await getPushDevicePayload()),
    });
    return { ok: true, token: tokenData.data };
  } catch (err: any) {
    errorPush('[Push] Erro ao salvar token no backend:', err?.message ?? err);
    return { ok: false, reason: 'api-error', detail: err?.message };
  }
}

export async function unregisterPushToken(): Promise<void> {
  const devicePayload = await getPushDevicePayload();

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    await api.delete('/users/me/push-token', {
      data: { pushToken: tokenData.data, ...devicePayload },
    });
  } catch (err: any) {
    try {
      await api.delete('/users/me/push-token', { data: devicePayload });
    } catch (fallbackErr: any) {
      warnPush('[Push] Não foi possível remover token do backend:', fallbackErr?.message ?? err?.message ?? err);
    }
  }
}
