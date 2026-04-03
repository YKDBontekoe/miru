export interface Agent {
  id: string;
  name: string;
  personality: string;
  description?: string;
  goals: string[];
  capabilities: string[];
  integrations: string[];
  integration_configs: Record<string, unknown>;
  system_prompt?: string;
  status: string;
  mood: string;
  message_count: number;
  avatar_url?: string;
  created_at: string;
}

export enum MessageStatus {
  sent = 'sent',
  streaming = 'streaming',
  delivered = 'delivered',
  error = 'error',
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id?: string;
  agent_id?: string;
  content: string;
  created_at: string;
  status: MessageStatus;
  crew_task_type?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned?: boolean;
  origin_context?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string | null;
  created_at: string;
  updated_at?: string;
}
