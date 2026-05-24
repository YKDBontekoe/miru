import { renderHook, act } from '@testing-library/react-native';
import { useProductivityViewModel } from '@/features/productivity/useProductivityViewModel';
import { useProductivityStore } from '@/store/useProductivityStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/productivity'),
  useLocalSearchParams: jest.fn(),
}));

// Mock useProductivityStore
jest.mock('@/store/useProductivityStore', () => ({
  useProductivityStore: jest.fn(),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key === 'todayPlan.recoverOverdue')
        return `1) Recover overdue: start with ${opts?.count} overdue task(s).`;
      if (key === 'todayPlan.noOverdue')
        return '1) No overdue tasks: start with highest-impact open work.';
      if (key === 'todayPlan.focusBlockItems') return `2) Focus block: ${opts?.tasks}.`;
      if (key === 'todayPlan.focusBlockEmpty')
        return '2) Focus block: no pending tasks, use this for planning or review.';
      if (key === 'todayPlan.calendarCheckpoints')
        return `3) Calendar checkpoints at ${opts?.times}.`;
      if (key === 'todayPlan.calendarLight')
        return '3) Calendar is light: reserve time for deep work and wrap-up.';
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

describe('useProductivityViewModel', () => {
  const mockFetchNotes = jest.fn();
  const mockFetchTasks = jest.fn();
  const mockFetchEvents = jest.fn();
  const mockDeleteNote = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockToggleTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (useRouter as jest.Mock).mockReturnValue({
      replace: jest.fn(),
    });

    (useProductivityStore as unknown as jest.Mock).mockReturnValue({
      notes: [
        {
          id: '1',
          title: 'Test Note 1',
          content: 'Content 1',
          created_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: '1',
          title: 'Test Task 1',
          completed: false,
          created_at: new Date().toISOString(),
          due_date: new Date().toISOString(),
        },
        { id: '2', title: 'Test Task 2', completed: true, created_at: new Date().toISOString() },
      ],
      events: [
        {
          id: '1',
          title: 'Test Event 1',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
        },
      ],
      fetchNotes: mockFetchNotes,
      fetchTasks: mockFetchTasks,
      fetchEvents: mockFetchEvents,
      isLoading: false,
      deleteNote: mockDeleteNote,
      deleteTask: mockDeleteTask,
      toggleTask: mockToggleTask,
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useProductivityViewModel());
    expect(result.current.activeTab).toBe('today');
    expect(result.current.searchQuery).toBe('');
    expect(result.current.showCreateNote).toBe(false);
    expect(result.current.showCreateTask).toBe(false);
  });

  it('fetches data on mount', () => {
    renderHook(() => useProductivityViewModel());
    expect(mockFetchNotes).toHaveBeenCalled();
    expect(mockFetchTasks).toHaveBeenCalled();
    expect(mockFetchEvents).toHaveBeenCalled();
  });

  it('filters data based on search query', () => {
    const { result } = renderHook(() => useProductivityViewModel());

    act(() => {
      result.current.setActiveTab('all');
    });

    act(() => {
      result.current.setSearchQuery('Non-existent');
    });
    expect(result.current.dataToRender.length).toBe(0);

    act(() => {
      result.current.setSearchQuery('Test Note');
    });
    // activeTab is 'all', so it mixes tasks and notes matching search
    // wait, our tasks also contain "Test" but maybe not "Note"
    expect(result.current.dataToRender.length).toBe(1);
    expect(result.current.dataToRender[0].id).toBe('note-1');
  });

  it('handles active tabs correctly', () => {
    const { result } = renderHook(() => useProductivityViewModel());

    act(() => {
      result.current.setActiveTab('notes');
    });
    expect(result.current.dataToRender.length).toBe(1);
    expect(result.current.dataToRender[0].id).toBe('1');
    expect(result.current.dataToRender[0].type).toBe('note');

    act(() => {
      result.current.setActiveTab('tasks');
    });
    // the prioritizedTasks only includes uncompleted tasks
    expect(result.current.dataToRender.length).toBe(1);
    expect(result.current.dataToRender[0].type).toBe('task');
  });

  it('generates a today plan', () => {
    const { result } = renderHook(() => useProductivityViewModel());

    act(() => {
      result.current.generateTodayPlan();
    });

    expect(result.current.todayPlan).toContain('Focus block');
    expect(result.current.activeTab).toBe('today');
  });

  it('updates task priority filter', () => {
    const { result } = renderHook(() => useProductivityViewModel());

    act(() => {
      result.current.setTaskPriority('today');
    });

    expect(result.current.taskPriority).toBe('today');
    // Task priority counts should have been calculated
    expect(result.current.taskPriorityCounts.today).toBe(1);
  });
});
