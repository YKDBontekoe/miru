import { apiClient, streamChat } from './client';
import { Agent, ChatMessage, ChatRoom, Memory, Note, Task } from '../models';

// The backend Task schema uses is_completed; normalise to the frontend shape.
function normalizeTask(raw: Record<string, unknown>): Task {
  const { is_completed, ...rest } = raw as Record<string, unknown> & { is_completed?: boolean };
  return { ...rest, completed: is_completed ?? false } as unknown as Task;
}

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
    const response = await apiClient.get<Record<string, unknown>[]>('productivity/tasks');
    return response.data.map(normalizeTask);
  },

  async createTask(title: string): Promise<Task> {
    const response = await apiClient.post<Record<string, unknown>>('productivity/tasks', { title });
    return normalizeTask(response.data);
  },

  async updateTask(
    id: string,
    data: Partial<{ completed: boolean; title: string; due_date: string | null }>
  ): Promise<Task> {
    // Map completed -> is_completed for the backend schema.
    const { completed, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (completed !== undefined) payload.is_completed = completed;
    const response = await apiClient.patch<Record<string, unknown>>(
      `productivity/tasks/${id}`,
      payload
    );
    return normalizeTask(response.data);
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
