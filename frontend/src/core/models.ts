export interface Agent {
  id: string;
  name: string;
  personality: string;
  description?: string;
  goals: string[];
  capabilities: string[];
  integrations: string[];
  integration_configs: Record<string, any>;
  system_prompt?: string;
  status: string;
  mood: string;
  message_count: number;
  avatar_url?: string;
  created_at: string;
}

/* eslint-disable no-unused-vars */
export enum MessageStatus {
  sent = 'sent',
  streaming = 'streaming',
  delivered = 'delivered',
  error = 'error',
}
/* eslint-enable no-unused-vars */

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
}

export interface Memory {
  id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
}
