import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { ChatMessage, ChatRoom, MessageStatus } from '../core/models';
import { chatHub, AgentActivityData, HubMessageData } from '../core/services/ChatHubService';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  /** Live agent activity keyed by room_id — null when no activity */
  agentActivity: Record<string, AgentActivityData | null>;
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

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  agentActivity: {},
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
      // ---- Incoming message ----
      if (frame.type === 'message' && frame.data) {
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
          // Avoid duplicates — the sender already has the user message (optimistic)
          const deduped = existing.filter((m) => m.id !== incomingMsg.id);
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
    });
  },

  disconnectHub: () => {
    _hubUnsub?.();
    _hubUnsub = null;
    chatHub.disconnect();
  },

  joinRoom: (roomId) => chatHub.joinRoom(roomId),
  leaveRoom: (roomId) => chatHub.leaveRoom(roomId),

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const rooms = await ApiService.getRooms();
      set({ rooms, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  fetchMessages: async (roomId) => {
    set({ isLoadingMessages: true });
    try {
      const messages = await ApiService.getRoomMessages(roomId);
      set((state) => ({
        messages: { ...state.messages, [roomId]: messages },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------

  sendMessage: async (roomId, content) => {
    // Optimistic user bubble
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
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
    }));

    // Ensure hub is connected before sending
    if (!chatHub.isConnected) {
      await chatHub.connect();
      // Re-join the room after reconnect
      chatHub.joinRoom(roomId);
    }

    if (chatHub.isConnected) {
      chatHub.sendMessage(roomId, content);
    } else {
      // Fallback: mark as error so the user can retry
      set((state) => {
        const list = [...(state.messages[roomId] ?? [])];
        const idx = list.findIndex((m) => m.id === userMessage.id);
        if (idx >= 0) list[idx] = { ...list[idx], status: MessageStatus.error };
        return { messages: { ...state.messages, [roomId]: list }, isStreaming: false };
      });
    }
  },

  stopStreaming: () => {
    // Clear all activity indicators (the server will keep running, but the UI
    // stops showing the busy state — the result will still arrive via the hub)
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
