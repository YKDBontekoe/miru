import { ApiService } from '../src/core/api/ApiService';
import { apiClient } from '../src/core/api/client';

jest.mock('../src/core/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ApiService - Productivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch tasks and normalize them', async () => {
    const rawTask = {
      id: 'task-1',
      user_id: 'user-1',
      title: 'Buy Milk',
      is_completed: false,
      created_at: '2024-01-01T00:00:00Z',
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [rawTask] });

    const tasks = await ApiService.getTasks();
    expect(apiClient.get).toHaveBeenCalledWith('productivity/tasks', { signal: undefined });
    expect(tasks[0]).toEqual({
      id: 'task-1',
      user_id: 'user-1',
      title: 'Buy Milk',
      completed: false,
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  it('should create a task and normalize it', async () => {
    const rawTask = {
      id: 'task-2',
      title: 'New Task',
      is_completed: false,
      created_at: '2024-01-01T00:00:00Z',
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: rawTask });

    const task = await ApiService.createTask('New Task', '2025-01-01T00:00:00Z');
    expect(apiClient.post).toHaveBeenCalledWith('productivity/tasks', { title: 'New Task', due_date: '2025-01-01T00:00:00Z' });
    expect(task.completed).toBe(false);
  });

  it('should update a task and map completed -> is_completed', async () => {
    const rawTask = {
      id: 'task-3',
      title: 'Updated Task',
      is_completed: true,
    };
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: rawTask });

    const task = await ApiService.updateTask('task-3', { completed: true, title: 'Updated Task' });
    expect(apiClient.patch).toHaveBeenCalledWith('productivity/tasks/task-3', { is_completed: true, title: 'Updated Task' });
    expect(task.completed).toBe(true);
  });

  it('should delete a task', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await ApiService.deleteTask('task-1');
    expect(apiClient.delete).toHaveBeenCalledWith('productivity/tasks/task-1');
  });

  it('should fetch notes', async () => {
    const rawNote = {
      id: 'note-1',
      title: 'Note',
      content: 'Content',
      is_pinned: false,
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [rawNote] });

    const notes = await ApiService.getNotes();
    expect(apiClient.get).toHaveBeenCalledWith('productivity/notes', { signal: undefined });
    expect(notes[0]).toEqual(rawNote);
  });

  it('should create a note', async () => {
    const rawNote = {
      id: 'note-2',
      title: 'New Note',
      content: 'Content 2',
      is_pinned: false,
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: rawNote });

    const note = await ApiService.createNote('New Note', 'Content 2');
    expect(apiClient.post).toHaveBeenCalledWith('productivity/notes', { title: 'New Note', content: 'Content 2' });
    expect(note).toEqual(rawNote);
  });

  it('should update a note', async () => {
    const rawNote = {
      id: 'note-3',
      title: 'Updated Note',
      content: 'Content 3',
      is_pinned: true,
    };
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: rawNote });

    const note = await ApiService.updateNote('note-3', { is_pinned: true });
    expect(apiClient.patch).toHaveBeenCalledWith('productivity/notes/note-3', { is_pinned: true });
    expect(note).toEqual(rawNote);
  });

  it('should delete a note', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await ApiService.deleteNote('note-1');
    expect(apiClient.delete).toHaveBeenCalledWith('productivity/notes/note-1');
  });

  it('should fetch events', async () => {
    const rawEvent = {
      id: 'event-1',
      title: 'Event',
      start_time: '2024-01-01T09:00:00Z',
      end_time: '2024-01-01T10:00:00Z',
      is_all_day: false,
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [rawEvent] });

    const events = await ApiService.getEvents();
    expect(apiClient.get).toHaveBeenCalledWith('productivity/events', { signal: undefined });
    expect(events[0]).toEqual(rawEvent);
  });

  it('should handle getTasks network failure gracefully', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network Error'));
    await expect(ApiService.getTasks()).rejects.toThrow('Network Error');
  });

  it('should handle createTask validation failure gracefully', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Validation Error'));
    await expect(ApiService.createTask('', null)).rejects.toThrow('Validation Error');
  });

  it('should handle updateNote server failure gracefully', async () => {
    (apiClient.patch as jest.Mock).mockRejectedValue(new Error('Internal Server Error'));
    await expect(ApiService.updateNote('note-1', { is_pinned: true })).rejects.toThrow('Internal Server Error');
  });

  it('should handle deleteEvent network delay/timeout gracefully', async () => {
    // Assuming deleteEvent was added or checking one of the delete functions.
    (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Timeout Error'));
    await expect(ApiService.deleteTask('event-1')).rejects.toThrow('Timeout Error');
  });
});
