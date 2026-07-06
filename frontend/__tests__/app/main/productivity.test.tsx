import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductivityScreen from '../../../app/(main)/productivity';
import { useProductivityStore } from '../../../src/store/useProductivityStore';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/productivity',
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../src/store/useProductivityStore', () => ({
  useProductivityStore: jest.fn(),
}));

describe('ProductivityScreen', () => {
  const mockFetchNotes = jest.fn();
  const mockFetchTasks = jest.fn();
  const mockFetchEvents = jest.fn();
  const mockDeleteNote = jest.fn();
  const mockDeleteTask = jest.fn();
  const mockToggleTask = jest.fn();

  beforeEach(() => {
    (useProductivityStore as unknown as jest.Mock).mockReturnValue({
      notes: [],
      tasks: [],
      events: [],
      fetchNotes: mockFetchNotes,
      fetchTasks: mockFetchTasks,
      fetchEvents: mockFetchEvents,
      isLoading: false,
      deleteNote: mockDeleteNote,
      deleteTask: mockDeleteTask,
      toggleTask: mockToggleTask,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with empty state', () => {
    const { getByText } = render(<ProductivityScreen />);
    expect(getByText('Workspace')).toBeTruthy();
    expect(getByText('productivity.nothing_urgent_today')).toBeTruthy();
  });

  it('fetches data on mount', () => {
    render(<ProductivityScreen />);
    expect(mockFetchNotes).toHaveBeenCalled();
    expect(mockFetchTasks).toHaveBeenCalled();
    expect(mockFetchEvents).toHaveBeenCalled();
  });

  it('changes tabs correctly', () => {
    const { getByText } = render(<ProductivityScreen />);
    const notesTab = getByText('productivity.notes');
    fireEvent.press(notesTab);
    expect(getByText('productivity.no_notes')).toBeTruthy();
  });
});
