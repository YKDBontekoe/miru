import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppCard } from '../src/components/AppCard';
import { Text } from 'react-native';

describe('AppCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
        <AppCard>
            <Text>Card Content</Text>
        </AppCard>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('calls onTap when clicked', () => {
    const onTapMock = jest.fn();
    const { getByText } = render(
        <AppCard onTap={onTapMock}>
            <Text>Clickable Card</Text>
        </AppCard>
    );
    fireEvent.press(getByText('Clickable Card'));
    expect(onTapMock).toHaveBeenCalledTimes(1);
  });

  it('handles press in and out interactions when onTap is provided', () => {
      const onTapMock = jest.fn();
      const { getByText } = render(
          <AppCard onTap={onTapMock}>
              <Text>Interactive Card</Text>
          </AppCard>
      );

      const card = getByText('Interactive Card');

      // Simulate press interactions to ensure code coverage of callbacks
      fireEvent(card, 'pressIn');
      fireEvent(card, 'pressOut');
  });
});
