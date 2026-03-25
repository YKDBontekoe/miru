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

  it('triggers onTap callback when pressed', () => {
    const onTapMock = jest.fn();
    const { getByTestId } = render(
      <AppCard onTap={onTapMock} testID="app-card">
        <Text>Tappable Card</Text>
      </AppCard>
    );

    const card = getByTestId('app-card');
    fireEvent.press(card);
    expect(onTapMock).toHaveBeenCalled();

    // Trigger Reanimated press handlers
    fireEvent(card, 'onPressIn');
    fireEvent(card, 'onPressOut');
  });

  it('renders without border when showBorder is false', () => {
    const { getByTestId } = render(
      <AppCard showBorder={false} testID="app-card">
        <Text>No Border</Text>
      </AppCard>
    );

    const card = getByTestId('app-card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderWidth: 0 })])
    );
  });
});
