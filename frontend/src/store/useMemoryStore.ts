import { create } from 'zustand';
import { ApiService } from '@/core/api/ApiService';
import { getApiErrorMessage } from '@/core/api/errors';
import { Memory } from '@/core/models';

interface MemoryState {
  memories: Memory[];
  isLoading: boolean;
  error: string | null;

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
  error: null,

  fetchMemories: async () => {
    set({ isLoading: true, error: null });
    try {
      const memories = await ApiService.getMemories();
      set({ memories, isLoading: false });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, 'Unable to load memories right now.'),
      });
    }
  },

  deleteMemory: async (id) => {
    // Capture only the removed item for rollback
    const removedMemory = get().memories.find((m) => m.id === id);

    if (!removedMemory) {
      // No memory found, nothing to delete
      return;
    }

    // Optimistically remove
    set((state) => ({ memories: state.memories.filter((m) => m.id !== id) }));

    try {
      await ApiService.deleteMemory(id);
    } catch (error) {
      // Single-item rollback: Re-insert only if it's not already present
      set((state) => {
        const isPresent = state.memories.some((m) => m.id === id);
        if (!isPresent) {
          return { memories: [...state.memories, removedMemory] };
        }
        return { memories: state.memories };
      });
      throw error;
    }
  },
}));
