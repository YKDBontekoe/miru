import { apiClient, streamChat } from './client';
import {
  Agent,
  AgentActionLog,
  AgentAffinity,
  CalendarEvent,
  ChatMessage,
  ChatRoom,
  DailyBrief,
  Memory,
  Note,
  NudgeCheckResponse,
  RecurrenceRule,
  Task,
  UnifiedSearchResponse,
} from '../models';

type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  personality: string;
  goals: string[];
};

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

  async getAgentAffinity(agentId: string): Promise<AgentAffinity | null> {
    try {
      const response = await apiClient.get<AgentAffinity>(`agents/${agentId}/affinity`);
      return response.data;
    } catch {
      return null;
    }
  },

  async triggerNudgeCheck(): Promise<NudgeCheckResponse> {
    const response = await apiClient.post<NudgeCheckResponse>('agents/nudge-check', {});
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

  async getRoomAgentLogs(roomId: string, limit = 50): Promise<AgentActionLog[]> {
    const response = await apiClient.get<AgentActionLog[]>(
      `rooms/${roomId}/agent-logs?limit=${limit}`
    );
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

  async createTask(
    title: string,
    opts?: {
      due_date?: string | null;
      recurrence_rule?: RecurrenceRule | null;
      recurrence_end_date?: string | null;
      auto_create_event?: boolean;
    }
  ): Promise<Task> {
    const response = await apiClient.post<Record<string, unknown>>('productivity/tasks', {
      title,
      ...opts,
    });
    return normalizeTask(response.data);
  },

  async updateTask(
    id: string,
    data: Partial<{
      completed: boolean;
      title: string;
      due_date: string | null;
      recurrence_rule: RecurrenceRule | null;
      recurrence_end_date: string | null;
    }>
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

  // --- Productivity: Calendar Events ---
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>('productivity/events');
    return response.data;
  },

  async createCalendarEvent(data: {
    title: string;
    start_time: string;
    end_time: string;
    description?: string | null;
    is_all_day?: boolean;
    location?: string | null;
    recurrence_rule?: RecurrenceRule | null;
    recurrence_end_date?: string | null;
    linked_task_id?: string | null;
  }): Promise<CalendarEvent> {
    const response = await apiClient.post<CalendarEvent>('productivity/events', data);
    return response.data;
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    await apiClient.delete(`productivity/events/${id}`);
  },

  // --- Daily Brief ---
  async getDailyBrief(): Promise<DailyBrief> {
    const response = await apiClient.get<DailyBrief>('productivity/daily-brief');
    return response.data;
  },

  // --- Unified Search ---
  async search(query: string, limit = 20): Promise<UnifiedSearchResponse> {
    const response = await apiClient.get<UnifiedSearchResponse>(
      `search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data;
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
