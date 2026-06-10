import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_KEY } from './api';
import { API_URL } from '../config';

const SOCKET_BASE_URL = API_URL.replace(/^http/, 'ws') + '/ws';
const TOKEN_KEY = ACCESS_TOKEN_KEY;

type Listener = (data: any) => void;

class NativeSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Salas desejadas — reenviadas a cada (re)conexão, já que o servidor
  // perde o estado de join quando a conexão cai.
  private rooms = new Set<string>();

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const url = token ? `${SOCKET_BASE_URL}?token=${encodeURIComponent(token)}` : SOCKET_BASE_URL;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
      this.rooms.forEach((id) => this.send('join', id));
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this.listeners.get(msg.event)?.forEach((fn) => fn(msg.data));
      } catch {}
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {};
  }

  send(event: string, data?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  join(householdId: string) {
    this.rooms.add(householdId);
    this.send('join', householdId);
  }

  leave(householdId: string) {
    this.rooms.delete(householdId);
    this.send('leave', householdId);
  }

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.rooms.clear();
    if (this.ws) {
      // evita que o onclose agende reconexão após logout
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = null;
  }
}

const socket = new NativeSocket();
export default socket;
