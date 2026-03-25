import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../src/components/AppButton';

describe('AppButton', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<AppButton label="Click Me" />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('handles onPress action', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(<AppButton label="Click Me" onPress={onPressMock} />);
    fireEvent.press(getByTestId('app-button'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('renders secondary variant correctly', () => {
    const { getByTestId } = render(<AppButton label="Secondary" variant="secondary" />);
    const button = getByTestId('app-button');
    expect(button).toBeTruthy();
  });

  it('renders outline variant correctly', () => {
    const { getByTestId } = render(<AppButton label="Outline" variant="outline" />);
    const button = getByTestId('app-button');
    expect(button).toBeTruthy();
  });

  it('renders ghost variant correctly', () => {
    const { getByTestId } = render(<AppButton label="Ghost" variant="ghost" />);
    const button = getByTestId('app-button');
    expect(button).toBeTruthy();
  });

  it('displays loading indicator when isLoading is true', () => {
    const { getByTestId } = render(<AppButton label="Loading..." isLoading={true} />);
    const button = getByTestId('app-button');
    // Ensure the button is disabled while loading
    expect(button.props.accessibilityState.disabled).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <AppButton label="Disabled" disabled={true} onPress={onPressMock} />
    );
    const button = getByTestId('app-button');
    expect(button.props.accessibilityState.disabled).toBeTruthy();

    // Reanimated Pressable handling test
    fireEvent(button, 'onPressIn');
    fireEvent(button, 'onPressOut');
  });

  it('handles press animations when enabled', () => {
    const { getByTestId } = render(<AppButton label="Click Me" />);
    const button = getByTestId('app-button');

    // Simulate pressIn and pressOut to trigger reanimated logic
    fireEvent(button, 'onPressIn');
    fireEvent(button, 'onPressOut');
  });
});
