import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../src/components/AppButton';
import { Text } from 'react-native';

describe('AppButton', () => {
  it('renders correctly with label', () => {
    const { getByText } = render(<AppButton label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AppButton label="Click Me" onPress={onPressMock} />);
    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('handles press in and press out events', () => {
    const onPressInMock = jest.fn();
    const onPressOutMock = jest.fn();
    const { getByTestId } = render(
      <AppButton label="Click Me" onPressIn={onPressInMock} onPressOut={onPressOutMock} />
    );
    const button = getByTestId('app-button');
    fireEvent(button, 'pressIn');
    expect(onPressInMock).toHaveBeenCalledTimes(1);
    fireEvent(button, 'pressOut');
    expect(onPressOutMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading is true', () => {
    const onPressMock = jest.fn();
    const onPressInMock = jest.fn();
    const onPressOutMock = jest.fn();

    const { getByTestId } = render(
      <AppButton label="Wait" isLoading={true} onPress={onPressMock} onPressIn={onPressInMock} onPressOut={onPressOutMock} />
    );
    const button = getByTestId('app-button');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
    // The handlePressIn and Out are called but the internal state ignores it since isDisabled is true
  });

  // Reanimated creates complex deeply nested nodes so we check the text node color instead
  it('renders secondary variant text color', () => {
    const { getByText } = render(<AppButton label="Secondary" variant="secondary" />);
    const text = getByText('Secondary');
    expect(text.props.className).toContain('text-onSurface-light');
  });

  it('renders outline variant text color', () => {
    const { getByText } = render(<AppButton label="Outline" variant="outline" />);
    const text = getByText('Outline');
    expect(text.props.className).toContain('text-onSurface-light');
  });

  it('renders ghost variant text color', () => {
    const { getByText } = render(<AppButton label="Ghost" variant="ghost" />);
    const text = getByText('Ghost');
    expect(text.props.className).toContain('text-primary');
  });

  it('renders custom disabled state properly for text', () => {
    const { getByText } = render(<AppButton label="Disabled" disabled={true} />);
    const text = getByText('Disabled');
    expect(text.props.className).toContain('text-onSurface-disabledLight');
  });
});
