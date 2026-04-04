import { create } from 'zustand';
import { ApiService } from '@/core/api/ApiService';
import { getApiErrorMessage } from '@/core/api/errors';
import { CalendarEvent, Note, Task } from '@/core/models';

interface ProductivityState {
  notes: Note[];
  tasks: Task[];
  events: CalendarEvent[];
  pendingRequests: number;
  isLoading: boolean;
  error: string | null;
  isLoadingNotes: boolean;
  isLoadingTasks: boolean;
  isLoadingEvents: boolean;
  errorNotes: string | null;
  errorTasks: string | null;
  errorEvents: string | null;
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
  pendingRequests: 0,
  isLoading: false,
  error: null,
  isLoadingNotes: false,
  isLoadingTasks: false,
  isLoadingEvents: false,
  errorNotes: null,
  errorTasks: null,
  errorEvents: null,

  fetchNotes: async (signal?: AbortSignal) => {
    set((state) => ({
      pendingRequests: state.pendingRequests + 1,
      isLoading: true,
      isLoadingNotes: true,
      errorNotes: null,
      error: null,
    }));
    try {
      const notes = await ApiService.getNotes(signal);
      set((state) => ({
        notes,
        isLoadingNotes: false,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
    } catch (error: unknown) {
      if (signal?.aborted) {
        set((state) => ({
          isLoadingNotes: false,
          pendingRequests: Math.max(0, state.pendingRequests - 1),
          isLoading: Math.max(0, state.pendingRequests - 1) > 0,
        }));
        return;
      }
      const errorMessage = getApiErrorMessage(error, 'Failed to load notes.');
      set((state) => ({
        isLoadingNotes: false,
        errorNotes: errorMessage,
        error: errorMessage,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
    }
  },

  fetchTasks: async (signal?: AbortSignal) => {
    set((state) => ({
      pendingRequests: state.pendingRequests + 1,
      isLoading: true,
      isLoadingTasks: true,
      errorTasks: null,
      error: null,
    }));
    try {
      const tasks = await ApiService.getTasks(signal);
      set((state) => ({
        tasks,
        isLoadingTasks: false,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
    } catch (error: unknown) {
      if (signal?.aborted) {
        set((state) => ({
          isLoadingTasks: false,
          pendingRequests: Math.max(0, state.pendingRequests - 1),
          isLoading: Math.max(0, state.pendingRequests - 1) > 0,
        }));
        return;
      }
      const errorMessage = getApiErrorMessage(error, 'Failed to load tasks.');
      set((state) => ({
        isLoadingTasks: false,
        errorTasks: errorMessage,
        error: errorMessage,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
    }
  },

  fetchEvents: async (signal?: AbortSignal) => {
    set((state) => ({
      pendingRequests: state.pendingRequests + 1,
      isLoading: true,
      isLoadingEvents: true,
      errorEvents: null,
      error: null,
    }));
    try {
      const events = await ApiService.getEvents(signal);
      set((state) => ({
        events,
        isLoadingEvents: false,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
    } catch (error: unknown) {
      if (signal?.aborted) {
        set((state) => ({
          isLoadingEvents: false,
          pendingRequests: Math.max(0, state.pendingRequests - 1),
          isLoading: Math.max(0, state.pendingRequests - 1) > 0,
        }));
        return;
      }
      const errorMessage = getApiErrorMessage(error, 'Failed to load events.');
      set((state) => ({
        isLoadingEvents: false,
        errorEvents: errorMessage,
        error: errorMessage,
        pendingRequests: Math.max(0, state.pendingRequests - 1),
        isLoading: Math.max(0, state.pendingRequests - 1) > 0,
      }));
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
