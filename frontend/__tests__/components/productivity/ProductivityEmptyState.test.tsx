import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductivityEmptyState } from '../../../src/components/productivity/ProductivityEmptyState';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

describe('ProductivityEmptyState', () => {
  const mockProps = {
    activeTab: 'notes' as const,
    searchQuery: '',
    onShowCreateNote: jest.fn(),
    onShowCreateTask: jest.fn(),
  };

  it('renders correctly for notes tab', () => {
    const { getByText } = render(<ProductivityEmptyState {...mockProps} />);
    expect(getByText('productivity.no_notes')).toBeTruthy();
  });

  it('renders correctly for search query', () => {
    const { getByText } = render(<ProductivityEmptyState {...mockProps} searchQuery="test" />);
    expect(getByText('productivity.no_matches')).toBeTruthy();
  });

  it('calls action handlers', () => {
    const { getByText } = render(<ProductivityEmptyState {...mockProps} activeTab="all" />);

    fireEvent.press(getByText('productivity.newNote'));
    expect(mockProps.onShowCreateNote).toHaveBeenCalled();

    fireEvent.press(getByText('productivity.new_task'));
    expect(mockProps.onShowCreateTask).toHaveBeenCalled();
  });
});
