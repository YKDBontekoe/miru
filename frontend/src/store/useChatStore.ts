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
  addAgentToRoom: (roomId: string, agentId: string) => Promise<void>;
  createRoom: (name: string) => Promise<ChatRoom>;
}

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
    } catch (error) {
      console.error('Error fetching rooms:', error);
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
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  addAgentToRoom: async (roomId: string, agentId: string) => {
    try {
      await ApiService.addAgentToRoom(roomId, agentId);
    } catch (error) {
      console.error('Error adding agent to room:', error);
      throw error;
    }
  },

  createRoom: async (name: string) => {
    const room = await ApiService.createRoom(name);
    set((state) => ({ rooms: [room, ...state.rooms] }));
    return room;
  },

  sendMessage: async (roomId: string, content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      room_id: roomId,
      content,
      created_at: new Date().toISOString(),
      status: MessageStatus.sent,
      user_id: 'me', // Temporary
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), userMessage],
      },
    }));

    const assistantPlaceholder: ChatMessage = {
      id: (Date.now() + 1).toString(),
      room_id: roomId,
      content: '',
      created_at: new Date().toISOString(),
      status: MessageStatus.streaming,
      agent_id: 'assistant', // Temporary
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), assistantPlaceholder],
      },
      isStreaming: true,
    }));

    try {
      await ApiService.streamRoomChat(roomId, content, (chunk) => {
        set((state) => {
          const roomMessages = [...(state.messages[roomId] || [])];
          const lastIdx = roomMessages.length - 1;
          if (lastIdx >= 0) {
            roomMessages[lastIdx] = {
              ...roomMessages[lastIdx],
              content: roomMessages[lastIdx].content + chunk,
            };
          }
          return {
            messages: { ...state.messages, [roomId]: roomMessages },
          };
        });
      });

      set((state) => {
        const roomMessages = [...(state.messages[roomId] || [])];
        const lastIdx = roomMessages.length - 1;
        if (lastIdx >= 0) {
          roomMessages[lastIdx] = {
            ...roomMessages[lastIdx],
            status: MessageStatus.sent,
          };
        }
        return {
          messages: { ...state.messages, [roomId]: roomMessages },
          isStreaming: false,
        };
      });
    } catch (error) {
      console.error('Error streaming chat:', error);
      set({ isStreaming: false });
    }
  },
}));
