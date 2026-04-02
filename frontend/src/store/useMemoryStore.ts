import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { Memory } from '../core/models';

interface MemoryState {
  memories: Memory[];
  isLoading: boolean;

  fetchMemories: () => Promise<void>;
  /** Removes from local state immediately (optimistic). Call confirmDelete after undo window if needed, or delete immediately on server. */
  deleteMemory: (id: string) => Promise<void>;
}

/**
 * Zustand store for managing Memory entities and their UI state.
 *
 * State includes:
 * - `memories`: List of loaded Memory entities.
 *
 * It provides optimistic updates for deletion to ensure the UI
 * responds instantly while the server request completes in the background.
 */
export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  isLoading: false,

  fetchMemories: async () => {
    set({ isLoading: true });
    try {
      const memories = await ApiService.getMemories();
      set({ memories, isLoading: false });
    } catch (error) {
      console.error('Error fetching memories:', error);
      set({ isLoading: false });
    }
  },

  deleteMemory: async (id) => {
    // Save previous state for rollback
    const previousMemories = get().memories;

    // Optimistically remove
    set((state) => ({ memories: state.memories.filter((m) => m.id !== id) }));

    try {
      await ApiService.deleteMemory(id);
    } catch (error) {
      // Rollback optimistic update
      set({ memories: previousMemories });
      throw error;
    }
  },
}));
