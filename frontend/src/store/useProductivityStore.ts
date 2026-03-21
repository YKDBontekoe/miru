import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { Note, Task } from '../core/models';

interface ProductivityState {
  notes: Note[];
  tasks: Task[];
  isLoading: boolean;
  fetchNotes: () => Promise<void>;
  fetchTasks: () => Promise<void>;
}

export const useProductivityStore = create<ProductivityState>((set) => ({
  notes: [],
  tasks: [],
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await ApiService.getNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Error fetching notes:', error);
      set({ isLoading: false });
    }
  },

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await ApiService.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ isLoading: false });
    }
  },
}));
