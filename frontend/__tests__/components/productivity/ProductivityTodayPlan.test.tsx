import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductivityTodayPlan } from '../../../src/components/productivity/ProductivityTodayPlan';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

describe('ProductivityTodayPlan', () => {
  const mockProps = {
    todayPlan: 'This is the plan for today',
    onClearPlan: jest.fn(),
  };

  it('renders correctly when there is a plan', () => {
    const { getByText } = render(<ProductivityTodayPlan {...mockProps} />);
    expect(getByText('Today plan')).toBeTruthy();
    expect(getByText('This is the plan for today')).toBeTruthy();
  });

  it('returns null when there is no plan', () => {
    const { queryByText } = render(<ProductivityTodayPlan {...mockProps} todayPlan={null} />);
    expect(queryByText('Today plan')).toBeNull();
  });

  it('calls onClearPlan when the close button is pressed', () => {
    const { getByLabelText } = render(<ProductivityTodayPlan {...mockProps} />);
    fireEvent.press(getByLabelText("Clear today's plan"));
    expect(mockProps.onClearPlan).toHaveBeenCalled();
  });
});
