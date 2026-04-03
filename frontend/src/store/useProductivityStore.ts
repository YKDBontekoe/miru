import { create } from 'zustand';
import { ApiService } from '../core/api/ApiService';
import { getApiErrorMessage } from '../core/api/errors';
import { CalendarEvent, Note, Task } from '../core/models';

interface ProductivityState {
  notes: Note[];
  tasks: Task[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: (signal?: AbortSignal) => Promise<void>;
  fetchTasks: (signal?: AbortSignal) => Promise<void>;
  fetchEvents: (signal?: AbortSignal) => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createTask: (title: string, dueDate?: string | null) => Promise<void>;
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
  events: [],
  isLoading: false,
  error: null,

  fetchNotes: async (signal?: AbortSignal) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await ApiService.getNotes(signal);
      set({ notes, isLoading: false });
    } catch (error: unknown) {
      if (signal?.aborted) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: getApiErrorMessage(error, 'Failed to load notes.') });
    }
  },

  fetchTasks: async (signal?: AbortSignal) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await ApiService.getTasks(signal);
      set({ tasks, isLoading: false });
    } catch (error: unknown) {
      if (signal?.aborted) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: getApiErrorMessage(error, 'Failed to load tasks.') });
    }
  },

  fetchEvents: async (signal?: AbortSignal) => {
    set({ isLoading: true, error: null });
    try {
      const events = await ApiService.getEvents(signal);
      set({ events, isLoading: false });
    } catch (error: unknown) {
      if (signal?.aborted) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: getApiErrorMessage(error, 'Failed to load events.') });
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

  createTask: async (title: string, dueDate: string | null = null) => {
    const task = await ApiService.createTask(title, dueDate);
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
