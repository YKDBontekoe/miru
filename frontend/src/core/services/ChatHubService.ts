/**
 * ChatHubService — WebSocket client that mirrors a SignalR hub.
 *
 * Connects to `ws(s)://<host>/api/v1/ws/chat?token=<jwt>` and exposes:
 *  - Room membership (joinRoom / leaveRoom)
 *  - Message sending (sendMessage)
 *  - Typed listener callbacks for all server → client frame types
 *  - Automatic reconnect with exponential back-off
 *  - Keep-alive ping every 30 s
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useAppStore } from '../../store/useAppStore';
import i18next from 'i18next';

// ---------------------------------------------------------------------------
// Frame types
// ---------------------------------------------------------------------------

export type HubActivityType = 'thinking' | 'using_tool' | 'done';

export interface AgentActivityData {
  room_id: string;
  agent_names: string[];
  activity: HubActivityType;
  detail: string;
}

export interface HubMessageData {
  id: string;
  room_id: string;
  user_id: string | null;
  agent_id: string | null;
  content: string;
  created_at: string;
  /** Echoed back to the sender to replace optimistic bubbles */
  clientTempId?: string | null;
}

export type HubFrameType =
  | 'connected'
  | 'pong'
  | 'joined_room'
  | 'message'
  | 'agent_activity'
  | 'error';

export interface HubFrame {
  type: HubFrameType;
  user_id?: string;
  room_id?: string;
  data?: HubMessageData | AgentActivityData | { message: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCAL_BACKEND_URL = Platform.select({
  android: 'https://10.0.2.2:8000',
  ios: 'https://localhost:8000',
  default: 'https://localhost:8000',
});

function toWsUrl(httpBase: string): string {
  const base = httpBase.replace(/^https?/, 'wss').replace(/\/+$/, '');
  // Avoid doubling the /api/v1 segment when the baseUrl already includes it
  return base.endsWith('/api/v1') ? `${base}/ws/chat` : `${base}/api/v1/ws/chat`;
}

type FrameListener = (frame: HubFrame) => void;

// ---------------------------------------------------------------------------
// ChatHubService
// ---------------------------------------------------------------------------

class ChatHubService {
  private ws: WebSocket | null = null;
  private listeners = new Set<FrameListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private reconnectDelay = 2000;
  private connectionPromise: Promise<void> | null = null;

  // ------------------------------------------------------------------
  // Connection lifecycle
  // ------------------------------------------------------------------

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connectionPromise) return this.connectionPromise;

    this.active = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          const token = session?.access_token;

          if (!token) {
            if (this.active) {
              this.reconnectTimer = setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 15000);
                this.connect().catch(() => {});
              }, this.reconnectDelay);
            }
            this.connectionPromise = null;
            return reject(new Error('No auth session'));
          }

          const baseUrl = useAppStore.getState().baseUrl || LOCAL_BACKEND_URL;
          const lang = i18next.language || 'en';
          const url = `${toWsUrl(baseUrl)}?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;

          const ws = new WebSocket(url);
          this.ws = ws;

          ws.onopen = () => {
            this.reconnectDelay = 2000;
            this._startPing();
            resolve();
          };

          ws.onmessage = (event) => {
            try {
              const frame: HubFrame = JSON.parse(event.data as string);
              this.listeners.forEach((l) => l(frame));
            } catch {
              // ignore malformed frames
            }
          };

          ws.onclose = () => {
            this._stopPing();
            this.connectionPromise = null;
            if (this.active) {
              this.reconnectTimer = setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 15000);
                this.connect().catch(() => {});
              }, this.reconnectDelay);
            }
            reject(new Error('WebSocket closed'));
          };

          ws.onerror = () => {
            ws.close();
          };
        })
        .catch((err) => {
          this.connectionPromise = null;
          reject(err);
        });
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    this.active = false;
    this.connectionPromise = null;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  // ------------------------------------------------------------------
  // Hub methods (client → server)
  // ------------------------------------------------------------------

  joinRoom(roomId: string): void {
    this._send({ type: 'join_room', room_id: roomId });
  }

  leaveRoom(roomId: string): void {
    this._send({ type: 'leave_room', room_id: roomId });
  }

  sendMessage(roomId: string, content: string, clientTempId?: string): void {
    this._send({ type: 'send_message', room_id: roomId, content, clientTempId });
  }

  // ------------------------------------------------------------------
  // Listener management
  // ------------------------------------------------------------------

  /** Subscribe to all incoming hub frames. Returns an unsubscribe function. */
  addListener(listener: FrameListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ------------------------------------------------------------------
  // Accessors
  // ------------------------------------------------------------------

  get isConnected(): boolean {
    // Guard against environments (e.g. Jest) where WebSocket global may be absent
    const WS_OPEN = typeof WebSocket !== 'undefined' ? WebSocket.OPEN : 1;
    return this.ws?.readyState === WS_OPEN;
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private _send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => this._send({ type: 'ping' }), 30_000);
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton (mirrors SignalR's HubConnection instance pattern)
// ---------------------------------------------------------------------------
export const chatHub = new ChatHubService();
