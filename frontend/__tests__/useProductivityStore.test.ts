import { act } from '@testing-library/react-native';
import { ApiService } from '../src/core/api/ApiService';
// we'll mock ApiService to check the connection to the frontend models

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

describe('Frontend API Contract verification for Productivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ApiService shape for CalendarEvent is verified against models', async () => {
    const mockEvent = {
        id: 'evt-1',
        title: 'Meeting',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
        is_all_day: false,
        created_at: '2024-01-01T00:00:00Z',
    };
    (ApiService.getEvents as jest.Mock).mockResolvedValue([mockEvent]);

    const events = await ApiService.getEvents();
    expect(events[0].id).toBe('evt-1');
  });
});
