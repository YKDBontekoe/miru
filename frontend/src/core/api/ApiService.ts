import { apiClient } from './client';
import { Agent, CalendarEvent, ChatMessage, ChatRoom, Memory, Note, Task } from '../models';

type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  personality: string;
  goals: string[];
};

export interface RoomSummaryRecord {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  agents: { id: string; name: string }[];
  last_message: string | null;
  last_message_at: string | null;
  has_mention: boolean;
  has_task: boolean;
}

interface TaskApiRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  due_date?: string | null;
  created_at: string;
  updated_at?: string;
}

// The backend Task schema uses is_completed; normalise to the frontend shape.
function normalizeTask(raw: TaskApiRecord): Task {
  const { is_completed, ...rest } = raw;
  return {
    ...rest,
    completed: is_completed ?? false,
  };
}

export const ApiService = {
  // --- Memories API ---
  async getMemories(signal?: AbortSignal): Promise<Memory[]> {
    const response = await apiClient.get<{ memories: Memory[] }>('memory', { signal });
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

  async generateAgent(keywords: string): Promise<{
    name: string;
    personality: string;
    description: string;
    goals: string[];
    capabilities: string[];
    suggested_integrations: string[];
  }> {
    const response = await apiClient.post<{
      name: string;
      personality: string;
      description: string;
      goals: string[];
      capabilities: string[];
      suggested_integrations: string[];
    }>('agents/generate', { keywords });
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

  async getRoomSummaries(limit = 100, beforeId?: string): Promise<RoomSummaryRecord[]> {
    const response = await apiClient.get<RoomSummaryRecord[]>('rooms/summaries', {
      params: {
        limit,
        before_id: beforeId,
      },
    });
    return response.data;
  },

  async deleteRoom(roomId: string): Promise<void> {
    await apiClient.delete(`rooms/${roomId}`);
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

  async removeAgentFromRoom(roomId: string, agentId: string): Promise<void> {
    await apiClient.delete(`rooms/${roomId}/agents/${agentId}`);
  },

  async updateAgent(
    id: string,
    data: Partial<Pick<Agent, 'name' | 'personality' | 'description' | 'goals'>>
  ): Promise<Agent> {
    const response = await apiClient.patch<Agent>(`agents/${id}`, data);
    return response.data;
  },

  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`agents/${id}`);
  },

  async getTemplates(): Promise<AgentTemplate[]> {
    const response = await apiClient.get<AgentTemplate[]>('agents/templates');
    return response.data;
  },

  // --- Productivity: Notes ---
  async getNotes(signal?: AbortSignal): Promise<Note[]> {
    const response = await apiClient.get<Note[]>('productivity/notes', { signal });
    return response.data;
  },

  async createNote(title: string, content: string): Promise<Note> {
    const response = await apiClient.post<Note>('productivity/notes', { title, content });
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`productivity/notes/${id}`);
  },

  async updateNote(
    id: string,
    data: Partial<{ title: string; content: string; is_pinned: boolean }>
  ): Promise<Note> {
    const response = await apiClient.patch<Note>(`productivity/notes/${id}`, data);
    return response.data;
  },

  // --- Productivity: Tasks ---
  async getTasks(signal?: AbortSignal): Promise<Task[]> {
    const response = await apiClient.get<TaskApiRecord[]>('productivity/tasks', { signal });
    return response.data.map(normalizeTask);
  },

  async createTask(title: string, dueDate: string | null = null): Promise<Task> {
    const payload: { title: string; due_date?: string | null } = { title };
    if (dueDate !== null) payload.due_date = dueDate;
    const response = await apiClient.post<TaskApiRecord>('productivity/tasks', payload);
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
    const response = await apiClient.patch<TaskApiRecord>(`productivity/tasks/${id}`, payload);
    return normalizeTask(response.data);
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`productivity/tasks/${id}`);
  },

  // --- Productivity: Calendar Events ---
  async getEvents(signal?: AbortSignal): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>('productivity/events', { signal });
    return response.data;
  },
};
