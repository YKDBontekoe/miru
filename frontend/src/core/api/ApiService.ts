import { apiClient, streamChat } from './client';
import { Agent, ChatMessage, ChatRoom, Memory, Note, Task } from '../models';

export const ApiService = {
  // --- Memories API ---
  async getMemories(): Promise<Memory[]> {
    const response = await apiClient.get<{ memories: Memory[] }>('memory');
    return response.data.memories;
  },

  async deleteMemory(id: string): Promise<void> {
    await apiClient.delete(`memory/${id}`);
  },

  // --- Agents API ---
  async getAgents(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('agents');
    return response.data;
  },

  async createAgent(data: Partial<Agent>): Promise<Agent> {
    const response = await apiClient.post<Agent>('agents', data);
    return response.data;
  },

  async generateAgent(keywords: string): Promise<{ name: string; personality: string }> {
    const response = await apiClient.post<{ name: string; personality: string }>(
      'agents/generate',
      {
        keywords,
      }
    );
    return response.data;
  },

  // --- Chat Rooms API ---
  async getRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get<ChatRoom[]>('rooms');
    return response.data;
  },

  async createRoom(name: string): Promise<ChatRoom> {
    const response = await apiClient.post<ChatRoom>('rooms', { name });
    return response.data;
  },

  async getRoomMessages(roomId: string): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`rooms/${roomId}/messages`);
    return response.data;
  },

  async getRoomAgents(roomId: string): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>(`rooms/${roomId}/agents`);
    return response.data;
  },

  async addAgentToRoom(roomId: string, agentId: string): Promise<void> {
    await apiClient.post(`rooms/${roomId}/agents`, { agent_id: agentId });
  },

  // --- Productivity: Notes ---
  async getNotes(): Promise<Note[]> {
    const response = await apiClient.get<Note[]>('productivity/notes');
    return response.data;
  },

  async createNote(title: string, content: string): Promise<Note> {
    const response = await apiClient.post<Note>('productivity/notes', { title, content });
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`productivity/notes/${id}`);
  },

  // --- Productivity: Tasks ---
  async getTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('productivity/tasks');
    return response.data;
  },

  async createTask(title: string): Promise<Task> {
    const response = await apiClient.post<Task>('productivity/tasks', { title });
    return response.data;
  },

  async updateTask(id: string, data: Partial<Pick<Task, 'completed' | 'title'>>): Promise<Task> {
    const response = await apiClient.patch<Task>(`productivity/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`productivity/tasks/${id}`);
  },

  // Streaming Chat
  streamRoomChat(
    roomId: string,
    content: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ) {
    return streamChat(`rooms/${roomId}/chat`, { content }, onChunk, signal);
  },
};
