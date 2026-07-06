import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { getApiErrorMessage } from '../core/api/errors';
import { ChatMessage, ChatRoom, MessageStatus } from '../core/models';
import { chatHub, AgentActivityData, HubMessageData } from '../core/services/ChatHubService';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  /** Live agent activity keyed by room_id — null when no activity */
  agentActivity: Record<string, AgentActivityData | null>;
  /** Rooms that have received a joined_room ack from the server */
  joinedRooms: Record<string, boolean>;
  /** Latest user-visible error message */
  hubError: string | null;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  /** True while the hub is processing a message for any room */
  isStreaming: boolean;

  // Hub lifecycle
  connectHub: () => Promise<void>;
  disconnectHub: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;

  // Data fetching
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;

  // Messaging
  sendMessage: (roomId: string, content: string) => Promise<void>;
  stopStreaming: () => void;

  // Room management
  addAgentToRoom: (roomId: string, agentId: string) => Promise<void>;
  createRoom: (name: string) => Promise<ChatRoom>;
  deleteRoom: (roomId: string) => Promise<void>;
}

// Hub unsubscribe kept outside state so it doesn't trigger re-renders
let _hubUnsub: (() => void) | null = null;
const _pendingMessageTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
const MESSAGE_ACK_TIMEOUT_MS = 20_000;

function clearPendingTimeout(clientTempId: string): void {
  const timeout = _pendingMessageTimeouts[clientTempId];
  if (timeout) {
    clearTimeout(timeout);
    delete _pendingMessageTimeouts[clientTempId];
  }
}

/**
 * Zustand store for managing global chat state.
 *
 * Handles HTTP requests for loading rooms/messages, and orchestrates the
 * SignalR-compatible WebSocket hub for real-time messaging,
 * typing indicators, and agent activity updates.
 *
 * State includes:
 * - `rooms`: List of chat rooms.
 * - `messages`: Record mapping room IDs to message arrays.
 * - `agentActivity`: Real-time agent status (e.g., "thinking") per room.
 * - `joinedRooms`: Rooms successfully joined via the WebSocket hub.
 * - `hubError`: The most recent user-facing error from the WebSocket.
 * - `isLoadingRooms` / `isLoadingMessages` / `isStreaming`: Loading flags.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  agentActivity: {},
  joinedRooms: {},
  hubError: null,
  isLoadingRooms: false,
  isLoadingMessages: false,
  isStreaming: false,

  // -------------------------------------------------------------------------
  // Hub lifecycle
  // -------------------------------------------------------------------------

  connectHub: async () => {
    await chatHub.connect();

    // Remove any previous listener to avoid duplicates on reconnect
    _hubUnsub?.();

    _hubUnsub = chatHub.addListener((frame) => {
      // ---- Hub Connected / Reconnected ----
      if (frame.type === 'connected') {
        Object.entries(get().joinedRooms).forEach(([roomId, joined]) => {
          if (joined) chatHub.joinRoom(roomId);
        });
      }

      // ---- Room join confirmed ----
      if (frame.type === 'joined_room' && frame.room_id) {
        set((state) => ({
          joinedRooms: { ...state.joinedRooms, [frame.room_id!]: true },
        }));
      }

      // ---- Incoming message ----
      else if (frame.type === 'message' && frame.data) {
        const data = frame.data as HubMessageData;
        if (data.clientTempId) {
          clearPendingTimeout(data.clientTempId);
        }
        const incomingMsg: ChatMessage = {
          id: data.id,
          room_id: data.room_id,
          user_id: data.user_id ?? undefined,
          agent_id: data.agent_id ?? undefined,
          content: data.content,
          created_at: data.created_at,
          status: MessageStatus.sent,
        };

        set((state) => {
          const existing = state.messages[data.room_id] ?? [];
          // Deduplicate by real id AND by clientTempId (replaces the optimistic bubble)
          const deduped = existing.filter(
            (m) => m.id !== incomingMsg.id && m.id !== (data.clientTempId ?? '__none__')
          );
          return {
            messages: {
              ...state.messages,
              [data.room_id]: [...deduped, incomingMsg],
            },
            // Clear activity and streaming flag when the agent message arrives
            agentActivity: { ...state.agentActivity, [data.room_id]: null },
            isStreaming: data.user_id != null ? state.isStreaming : false,
          };
        });
      }

      // ---- Agent activity ----
      else if (frame.type === 'agent_activity' && frame.data) {
        const activity = frame.data as AgentActivityData;
        const roomId = activity.room_id;
        const isDone = activity.activity === 'done';
        set((state) => ({
          agentActivity: {
            ...state.agentActivity,
            [roomId]: isDone ? null : activity,
          },
          isStreaming: isDone ? false : state.isStreaming,
        }));
      }

      // ---- Hub error ----
      else if (frame.type === 'error' && frame.data) {
        const errData = frame.data as { message: string; room_id?: string };
        if (errData.room_id) {
          set((state) => {
            const list = [...(state.messages[errData.room_id ?? ''] ?? [])];
            const pendingIndex = [...list].reverse().findIndex((m) => m.status === MessageStatus.streaming);
            if (pendingIndex >= 0) {
              const actualIndex = list.length - 1 - pendingIndex;
              const pendingMessage = list[actualIndex];
              clearPendingTimeout(pendingMessage.id);
              list[actualIndex] = { ...pendingMessage, status: MessageStatus.error };
            }
            return {
              messages: { ...state.messages, [errData.room_id ?? '']: list },
              hubError: errData.message,
              isStreaming: false,
            };
          });
          return;
        }
        set({ hubError: errData.message, isStreaming: false });
      }
    });
  },

  disconnectHub: () => {
    _hubUnsub?.();
    _hubUnsub = null;
    chatHub.disconnect();
    Object.keys(_pendingMessageTimeouts).forEach(clearPendingTimeout);
    // Clear stale UI state so nothing leaks after navigation
    set((state) => {
      const cleared: Record<string, null> = {};
      Object.keys(state.agentActivity).forEach((k) => (cleared[k] = null));
      return { agentActivity: cleared, isStreaming: false, joinedRooms: {} };
    });
  },

  joinRoom: (roomId) => chatHub.joinRoom(roomId),

  leaveRoom: (roomId) => {
    chatHub.leaveRoom(roomId);
    // Clear activity and joined state for the room being left
    set((state) => ({
      agentActivity: { ...state.agentActivity, [roomId]: null },
      joinedRooms: { ...state.joinedRooms, [roomId]: false },
      isStreaming: false,
    }));
  },

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  fetchRooms: async () => {
    set({ isLoadingRooms: true, hubError: null });
    try {
      const rooms = await ApiService.getRooms();
      set({ rooms, isLoadingRooms: false });
    } catch (error: unknown) {
      set({
        isLoadingRooms: false,
        hubError: getApiErrorMessage(error, 'Failed to load rooms. Please try again.'),
      });
    }
  },

  fetchMessages: async (roomId) => {
    set({ isLoadingMessages: true, hubError: null });
    try {
      const messages = await ApiService.getRoomMessages(roomId);
      set((state) => ({
        messages: { ...state.messages, [roomId]: messages },
        isLoadingMessages: false,
      }));
    } catch (error: unknown) {
      set({
        isLoadingMessages: false,
        hubError: getApiErrorMessage(error, 'Failed to load messages. Please try again.'),
      });
    }
  },

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------

  sendMessage: async (roomId, content) => {
    // Gate on joined_room ack — the server must have confirmed we're in the room
    if (!get().joinedRooms[roomId]) {
      set({ hubError: 'Not yet joined this room. Please wait a moment and try again.' });
      return;
    }

    // Stable temp id used for the optimistic bubble and sent to the server so
    // it can echo it back for deduplication.
    const clientTempId = `user-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: clientTempId,
      room_id: roomId,
      content,
      created_at: new Date().toISOString(),
      status: MessageStatus.streaming,
      user_id: 'me',
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), userMessage],
      },
      isStreaming: true,
      hubError: null,
    }));

    // Ensure hub is connected before sending
    if (!chatHub.isConnected) {
      await chatHub.connect();
      chatHub.joinRoom(roomId);
    }

    if (chatHub.isConnected) {
      chatHub.sendMessage(roomId, content, clientTempId);
      _pendingMessageTimeouts[clientTempId] = setTimeout(() => {
        set((state) => {
          const list = [...(state.messages[roomId] ?? [])];
          const idx = list.findIndex((m) => m.id === clientTempId);
          if (idx < 0) {
            return state;
          }
          list[idx] = { ...list[idx], status: MessageStatus.error };
          return {
            messages: { ...state.messages, [roomId]: list },
            isStreaming: false,
            hubError: 'Message delivery timed out. Please retry.',
          };
        });
        clearPendingTimeout(clientTempId);
      }, MESSAGE_ACK_TIMEOUT_MS);
    } else {
      // Fallback: mark as error so the user can retry
      clearPendingTimeout(clientTempId);
      set((state) => {
        const list = [...(state.messages[roomId] ?? [])];
        const idx = list.findIndex((m) => m.id === clientTempId);
        if (idx >= 0) list[idx] = { ...list[idx], status: MessageStatus.error };
        return {
          messages: { ...state.messages, [roomId]: list },
          isStreaming: false,
          hubError: 'Connection lost. Please retry.',
        };
      });
    }
  },

  stopStreaming: () => {
    Object.keys(_pendingMessageTimeouts).forEach(clearPendingTimeout);
    set((state) => {
      const cleared: Record<string, null> = {};
      Object.keys(state.agentActivity).forEach((k) => (cleared[k] = null));
      return { agentActivity: cleared, isStreaming: false };
    });
  },

  // -------------------------------------------------------------------------
  // Room management
  // -------------------------------------------------------------------------

  addAgentToRoom: async (roomId, agentId) => {
    await ApiService.addAgentToRoom(roomId, agentId);
  },

  createRoom: async (name) => {
    const room = await ApiService.createRoom(name);
    set((state) => ({ rooms: [room, ...state.rooms] }));
    return room;
  },

  deleteRoom: async (roomId) => {
    try {
      await ApiService.deleteRoom(roomId);
    } catch {
      // If API fails, still proceed to local cleanup.
    }
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
      joinedRooms: Object.fromEntries(
        Object.entries(state.joinedRooms).filter(([id]) => id !== roomId)
      ),
      agentActivity: Object.fromEntries(
        Object.entries(state.agentActivity).filter(([id]) => id !== roomId)
      ),
    }));
  },
}));
