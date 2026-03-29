export interface Agent {
  id: string;
  name: string;
  personality: string;
  personality_history?: PersonalitySnapshot[];
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

export interface PersonalitySnapshot {
  date: string;
  personality: string;
  trigger: string;
  summary?: string;
}

export interface AgentAffinity {
  agent_id: string;
  affinity_score: number;
  trust_level: number;
  milestones: string[];
  last_interaction_at: string;
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

export interface AgentActionLog {
  id: string;
  agent_id: string;
  agent_name?: string;
  room_id: string;
  action_type: string;
  content: string;
  meta: Record<string, any>;
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
  is_pinned?: boolean;
  created_at: string;
}

export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  recurrence_rule?: RecurrenceRule | null;
  recurrence_end_date?: string | null;
  calendar_event_id?: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string | null;
  recurrence_rule?: RecurrenceRule | null;
  recurrence_end_date?: string | null;
  linked_task_id?: string | null;
  created_at: string;
}

export interface DailyBrief {
  greeting: string;
  summary: string;
  upcoming_events: string[];
  pending_tasks: string[];
  overdue_tasks: string[];
  generated_at: string;
}

export interface SearchResultItem {
  source: 'memory' | 'note' | 'task' | 'chat';
  id: string;
  title?: string | null;
  content: string;
  score?: number | null;
  created_at?: string | null;
  meta: Record<string, any>;
}

export interface UnifiedSearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
}

export interface NudgeCheckResponse {
  nudges_sent: number;
  details: string[];
}
