import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { Note, Task } from '../core/models';

interface ProductivityState {
  notes: Note[];
  tasks: Task[];
  isLoading: boolean;
  fetchNotes: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

/**
 * Zustand store for managing productivity data (Notes and Tasks).
 *
 * Interfaces with the backend API to perform CRUD operations on productivity
 * entities.
 *
 * State includes:
 * - `notes`: Array of Note objects.
 * - `tasks`: Array of Task objects.
 * - `isLoading`: Boolean flag indicating if a fetch operation is in progress.
 */
export const useProductivityStore = create<ProductivityState>((set, get) => ({
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

  createNote: async (title: string, content: string) => {
    const note = await ApiService.createNote(title, content);
    set((state) => ({ notes: [note, ...state.notes] }));
  },

  deleteNote: async (id: string) => {
    await ApiService.deleteNote(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  createTask: async (title: string) => {
    const task = await ApiService.createTask(title);
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  toggleTask: async (id: string) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = await ApiService.updateTask(id, { completed: !task.completed });
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteTask: async (id: string) => {
    await ApiService.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
