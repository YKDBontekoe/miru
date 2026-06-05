import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkspaceTabs } from '../../../../src/components/productivity/workspace/WorkspaceTabs';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('WorkspaceTabs', () => {
  it('renders all tabs and handles presses', () => {
    const onTabChange = jest.fn();
    const { getByText } = render(<WorkspaceTabs activeTab="today" onTabChange={onTabChange} />);

    expect(getByText('productivity.today')).toBeTruthy();
    expect(getByText('productivity.all')).toBeTruthy();
    expect(getByText('productivity.notes')).toBeTruthy();
    expect(getByText('productivity.tasks')).toBeTruthy();

    fireEvent.press(getByText('productivity.notes'));
    expect(onTabChange).toHaveBeenCalledWith('notes');
  });
});
