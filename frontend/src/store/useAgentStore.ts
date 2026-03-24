import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { Agent } from '../core/models';

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  generateAgent: (keywords: string) => Promise<{ name: string; personality: string }>;
}

// DOCS(miru-agent): needs documentation
export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  isLoading: false,

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

  createAgent: async (data: Partial<Agent>) => {
    const agent = await ApiService.createAgent(data);
    set((state) => ({ agents: [agent, ...state.agents] }));
    return agent;
  },

  generateAgent: async (keywords: string) => {
    return ApiService.generateAgent(keywords);
  },
}));
