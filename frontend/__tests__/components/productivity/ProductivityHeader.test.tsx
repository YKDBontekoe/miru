import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ProductivityHeader } from '../../../src/components/productivity/ProductivityHeader';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

describe('ProductivityHeader', () => {
  const mockProps = {
    pendingTasksCount: 2,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    onGeneratePlan: jest.fn(),
    onShowCreateNote: jest.fn(),
    onShowCreateTask: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with pending tasks', () => {
    const { getByText } = render(<ProductivityHeader {...mockProps} />);
    expect(getByText('Workspace')).toBeTruthy();
    expect(getByText('You have 2 tasks pending.')).toBeTruthy();
  });

  it('renders correctly with zero pending tasks', () => {
    const { getByText } = render(<ProductivityHeader {...mockProps} pendingTasksCount={0} />);
    expect(getByText("You're all caught up for today.")).toBeTruthy();
  });

  it('calls action handlers', () => {
    const { getByLabelText } = render(<ProductivityHeader {...mockProps} />);

    fireEvent.press(getByLabelText("Generate Today's Plan"));
    expect(mockProps.onGeneratePlan).toHaveBeenCalled();

    fireEvent.press(getByLabelText('Create Note'));
    expect(mockProps.onShowCreateNote).toHaveBeenCalled();

    fireEvent.press(getByLabelText('Create Task'));
    expect(mockProps.onShowCreateTask).toHaveBeenCalled();
  });

  it('handles search input change and debounces', () => {
    jest.useFakeTimers();
    const { getByPlaceholderText } = render(<ProductivityHeader {...mockProps} />);
    const searchInput = getByPlaceholderText('Search notes & tasks...');

    act(() => {
      fireEvent.changeText(searchInput, 'hello');
    });

    expect(searchInput.props.value).toBe('hello');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockProps.setSearchQuery).toHaveBeenCalledWith('hello');
    jest.useRealTimers();
  });
});
