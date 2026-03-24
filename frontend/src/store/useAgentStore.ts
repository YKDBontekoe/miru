import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { ApiService } from '../core/api/ApiService';
import { Agent } from '../core/models';

// Persistent preferences stored in MMKV
const prefs = createMMKV({ id: 'agent-prefs' });

function loadPinnedIds(): string[] {
  try {
    const raw = prefs.getString('pinned_ids');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function savePinnedIds(ids: string[]) {
  prefs.set('pinned_ids', JSON.stringify(ids));
}
function loadViewMode(): 'list' | 'grid' {
  return (prefs.getString('view_mode') as 'list' | 'grid') ?? 'list';
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  personality: string;
  goals: string[];
}

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  pinnedIds: string[];
  viewMode: 'list' | 'grid';
  templates: AgentTemplate[];
  isLoadingTemplates: boolean;

  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  generateAgent: (keywords: string) => Promise<{
    name: string;
    personality: string;
    description: string;
    goals: string[];
  }>;
  updateAgent: (
    id: string,
    data: Partial<Pick<Agent, 'name' | 'personality' | 'description' | 'goals'>>
  ) => Promise<Agent>;
  /** Soft-deletes on the server and removes from local state immediately. */
  deleteAgent: (id: string) => Promise<void>;
  /** Restores an agent that was optimistically removed (for undo). */
  restoreAgent: (agent: Agent) => void;
  /** Creates a copy of an existing agent with "(copy)" appended to the name. */
  duplicateAgent: (id: string) => Promise<Agent>;

  fetchTemplates: () => Promise<void>;

  togglePin: (id: string) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  isLoading: false,
  pinnedIds: loadPinnedIds(),
  viewMode: loadViewMode(),
  templates: [],
  isLoadingTemplates: false,

  fetchAgents: async () => {
    set({ isLoading: true });
    try {
      const agents = await ApiService.getAgents();
      set({ agents, isLoading: false });
    } catch (error) {
      console.error('Error fetching agents:', error);
      set({ isLoading: false });
    }
  },

  createAgent: async (data) => {
    // Optimistically add a placeholder, then replace with real data
    const agent = await ApiService.createAgent(data);
    set((state) => ({ agents: [agent, ...state.agents] }));
    return agent;
  },

  generateAgent: async (keywords) => {
    return ApiService.generateAgent(keywords);
  },

  updateAgent: async (id, data) => {
    const updated = await ApiService.updateAgent(id, data);
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? updated : a)),
    }));
    return updated;
  },

  deleteAgent: async (id) => {
    // Optimistically remove from state first, then call API
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) }));
    await ApiService.deleteAgent(id);
  },

  restoreAgent: (agent) => {
    set((state) => {
      // Avoid duplicates
      if (state.agents.find((a) => a.id === agent.id)) return state;
      return { agents: [agent, ...state.agents] };
    });
  },

  duplicateAgent: async (id) => {
    const source = get().agents.find((a) => a.id === id);
    if (!source) throw new Error('Agent not found');
    const copy = await ApiService.createAgent({
      name: `${source.name} (copy)`,
      personality: source.personality,
      description: source.description,
      goals: [...(source.goals ?? [])],
    });
    set((state) => ({ agents: [copy, ...state.agents] }));
    return copy;
  },

  fetchTemplates: async () => {
    set({ isLoadingTemplates: true });
    try {
      const templates = await ApiService.getTemplates();
      set({ templates, isLoadingTemplates: false });
    } catch {
      set({ isLoadingTemplates: false });
    }
  },

  togglePin: (id) => {
    set((state) => {
      const pinned = state.pinnedIds.includes(id)
        ? state.pinnedIds.filter((p) => p !== id)
        : [id, ...state.pinnedIds];
      savePinnedIds(pinned);
      return { pinnedIds: pinned };
    });
  },

  setViewMode: (mode) => {
    prefs.set('view_mode', mode);
    set({ viewMode: mode });
  },
}));
