import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { Agent } from '../core/models';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  generateAgent: (keywords: string) => Promise<{ name: string; personality: string }>;
}

// DOCS(miru-agent): needs documentation
export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await ApiService.getAgents();
      set({ agents, isLoading: false, error: null });
    } catch (error) {
      console.error('Error fetching agents:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
      });
    }
  },

  createAgent: async (data: Partial<Agent>) => {
    // Optimistic Update Setup
    const tempId = `temp_${Date.now()}`;
    const optimisticAgent: Agent = {
      id: tempId,
      name: data.name || '',
      personality: data.personality || '',
      description: data.description || '',
      system_prompt: data.system_prompt || '',
      status: 'idle',
      mood: 'neutral',
      goals: data.goals || [],
      capabilities: data.capabilities || [],
      integrations: data.integrations || [],
      integration_configs: data.integration_configs || {},
      message_count: 0,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ agents: [optimisticAgent, ...state.agents] }));

    try {
      const agent = await ApiService.createAgent(data);
      // Replace optimistic agent with actual
      set((state) => ({ agents: state.agents.map((a) => (a.id === tempId ? agent : a)) }));
      return agent;
    } catch (error) {
      // Rollback optimistic update
      set((state) => ({ agents: state.agents.filter((a) => a.id !== tempId) }));
      throw error;
    }
  },

  generateAgent: async (keywords: string) => {
    return ApiService.generateAgent(keywords);
  },
}));
