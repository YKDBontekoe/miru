import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppCard } from '../src/components/AppCard';
import { Text } from 'react-native';

describe('AppCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AppCard>
        <Text>Test Content</Text>
      </AppCard>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('handles tap events when onTap is provided', () => {
    const mockOnTap = jest.fn();
    const { getByText } = render(
      <AppCard onTap={mockOnTap}>
        <Text>Tappable Card</Text>
      </AppCard>
    );

    fireEvent.press(getByText('Tappable Card'));
    expect(mockOnTap).toHaveBeenCalledTimes(1);
  });
});
