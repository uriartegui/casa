import axios from 'axios';
import * as secureStorage from './secureStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://casa-api-4fq0.onrender.com';

console.log('[API] baseURL:', BASE_URL);

export const REFRESH_TOKEN_KEY = 'colmeia.refresh_token';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler: (() => void) | null = null;
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function drainQueue(token: string | null, error: unknown) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  pendingQueue = [];
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers['Authorization'] = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const storedRefresh = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefresh) throw new Error('no_refresh_token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: storedRefresh,
      });

      const newAccess: string = data.accessToken;
      const newRefresh: string = data.refreshToken;

      setAuthToken(newAccess);
      await secureStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

      drainQueue(newAccess, null);
      original.headers['Authorization'] = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(null, refreshError);
      if (unauthorizedHandler) unauthorizedHandler();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
