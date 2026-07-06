import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductivityTabs } from '../../../src/components/productivity/ProductivityTabs';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

describe('ProductivityTabs', () => {
  const mockProps = {
    activeTab: 'today' as const,
    setActiveTab: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(<ProductivityTabs {...mockProps} />);
    expect(getByText('productivity.today')).toBeTruthy();
    expect(getByText('productivity.all')).toBeTruthy();
  });

  it('calls setActiveTab when a tab is pressed', () => {
    const { getByText } = render(<ProductivityTabs {...mockProps} />);
    fireEvent.press(getByText('productivity.notes'));
    expect(mockProps.setActiveTab).toHaveBeenCalledWith('notes');
  });
});
