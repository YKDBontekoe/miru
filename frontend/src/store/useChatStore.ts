import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
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
}

// Hub unsubscribe kept outside state so it doesn't trigger re-renders
let _hubUnsub: (() => void) | null = null;

/**
 * Zustand store for managing chat functionality and WebSocket hub connection.
 *
 * Manages the state of chat rooms, messages, active streaming connections,
 * and live agent activity. Orchestrates the connection lifecycle of the chatHub
 * and handles incoming WebSocket frames to update the UI reactively.
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
      // ---- Room join confirmed ----
      if (frame.type === 'joined_room' && frame.room_id) {
        set((state) => ({
          joinedRooms: { ...state.joinedRooms, [frame.room_id!]: true },
        }));
      }

      // ---- Incoming message ----
      else if (frame.type === 'message' && frame.data) {
        const data = frame.data as HubMessageData;
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
        const errData = frame.data as { message: string };
        set({ hubError: errData.message });
      }
    });
  },

  disconnectHub: () => {
    _hubUnsub?.();
    _hubUnsub = null;
    chatHub.disconnect();
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
    } catch {
      set({ isLoadingRooms: false, hubError: 'Failed to load rooms. Please try again.' });
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
    } catch {
      set({ isLoadingMessages: false, hubError: 'Failed to load messages. Please try again.' });
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
      status: MessageStatus.sent,
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
    } else {
      // Fallback: mark as error so the user can retry
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
}));
