import { act } from '@testing-library/react-native';
import { useProductivityStore } from '../src/store/useProductivityStore';
import { ApiService } from '../src/core/api/ApiService';

jest.mock('../src/core/api/ApiService', () => ({
  ApiService: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
    getEvents: jest.fn(),
  },
}));

describe('useProductivityStore - Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ApiService shape for CalendarEvent is verified via store logic', async () => {
    const mockEvent = {
        id: 'evt-1',
        title: 'Meeting',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        is_all_day: false,
        created_at: '2024-01-01T00:00:00Z',
    };
    (ApiService.getEvents as jest.Mock).mockResolvedValue([mockEvent]);

    // Load events into the store
    await act(async () => {
        await useProductivityStore.getState().fetchEvents();
    });

    // Check store state mapping
    const events = useProductivityStore.getState().events;
    expect(events[0].id).toBe('evt-1');
    expect(events[0].title).toBe('Meeting');
  });
});
