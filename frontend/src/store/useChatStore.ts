import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { ChatMessage, ChatRoom, MessageStatus } from '../core/models';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;

  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  stopStreaming: () => void;
  addAgentToRoom: (roomId: string, agentId: string) => Promise<void>;
  createRoom: (name: string) => Promise<ChatRoom>;
}

// Held outside state so it doesn't cause re-renders
let activeController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  isLoadingRooms: false,
  isLoadingMessages: false,
  isStreaming: false,

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const rooms = await ApiService.getRooms();
      set({ rooms, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  fetchMessages: async (roomId: string) => {
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

  stopStreaming: () => {
    activeController?.abort();
  },

  addAgentToRoom: async (roomId: string, agentId: string) => {
    await ApiService.addAgentToRoom(roomId, agentId);
  },

  createRoom: async (name: string) => {
    const room = await ApiService.createRoom(name);
    set((state) => ({ rooms: [room, ...state.rooms] }));
    return room;
  },

  sendMessage: async (roomId: string, content: string) => {
    // Optimistically add the user bubble
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      room_id: roomId,
      content,
      created_at: new Date().toISOString(),
      status: MessageStatus.sent,
      user_id: 'me',
    };

    const placeholderId = `assistant-${Date.now() + 1}`;
    const assistantPlaceholder: ChatMessage = {
      id: placeholderId,
      room_id: roomId,
      content: '',
      created_at: new Date().toISOString(),
      status: MessageStatus.streaming,
      agent_id: 'assistant',
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []), userMessage, assistantPlaceholder],
      },
      isStreaming: true,
    }));

    // Helper to update the streaming bubble
    const updatePlaceholder = (update: Partial<ChatMessage>) =>
      set((state) => {
        const list = [...(state.messages[roomId] ?? [])];
        const idx = list.findIndex((m) => m.id === placeholderId);
        if (idx >= 0) list[idx] = { ...list[idx], ...update };
        return { messages: { ...state.messages, [roomId]: list } };
      });

    activeController = new AbortController();

    try {
      await ApiService.streamRoomChat(
        roomId,
        content,
        (chunk) =>
          updatePlaceholder({
            content:
              (get().messages[roomId]?.find((m) => m.id === placeholderId)?.content ?? '') + chunk,
          }),
        activeController.signal
      );
      updatePlaceholder({ status: MessageStatus.sent });
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort) {
        // Keep whatever partial content was received
        updatePlaceholder({ status: MessageStatus.sent });
      } else {
        updatePlaceholder({ status: MessageStatus.error });
      }
    } finally {
      activeController = null;
      set({ isStreaming: false });
    }
  },
}));
