import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppCard } from '../src/components/AppCard';
import { Text } from 'react-native';

describe('AppCard Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AppCard testID="card">
        <Text>Child Content</Text>
      </AppCard>
    );
    expect(getByText('Child Content')).toBeTruthy();
  });

  it('renders without border when showBorder is false', () => {
    const { getByTestId } = render(
      <AppCard testID="test-card" showBorder={false}>
        <Text>Content</Text>
      </AppCard>
    );
    const card = getByTestId('test-card');
    expect(card.props.className).not.toContain('border-border-light');
  });

  it('handles press interactions when onTap is provided', () => {
    const onTapMock = jest.fn();
    const { getByText } = render(
      <AppCard testID="test-card" onTap={onTapMock}>
        <Text>Content</Text>
      </AppCard>
    );

    const card = getByText('Content');

    // Test press in
    fireEvent(card, 'pressIn');

    // Test press out
    fireEvent(card, 'pressOut');

    // Test press
    fireEvent.press(card);
    expect(onTapMock).toHaveBeenCalledTimes(1);
  });
});
