import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../src/components/AppButton';

describe('AppButton', () => {
  it('renders correctly with label (primary variant)', () => {
    const { getByText, getByTestId } = render(<AppButton label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders correctly with secondary variant', () => {
    const { getByText } = render(<AppButton label="Secondary Button" variant="secondary" />);
    expect(getByText('Secondary Button')).toBeTruthy();
  });

  it('renders correctly with outline variant', () => {
    const { getByText } = render(<AppButton label="Outline Button" variant="outline" />);
    expect(getByText('Outline Button')).toBeTruthy();
  });

  it('renders correctly with ghost variant', () => {
    const { getByText } = render(<AppButton label="Ghost Button" variant="ghost" />);
    expect(getByText('Ghost Button')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AppButton label="Click Me" onPress={onPressMock} />);
    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading is true', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <AppButton label="Wait" isLoading={true} onPress={onPressMock} />
    );
    const button = getByTestId('app-button');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('handles press in and out interactions', () => {
      const onPressInMock = jest.fn();
      const onPressOutMock = jest.fn();
      const { getByTestId } = render(
          <AppButton label="Interactive Button" onPressIn={onPressInMock} onPressOut={onPressOutMock} />
      );

      const button = getByTestId('app-button');

      // Simulate press interactions to ensure code coverage of callbacks
      fireEvent(button, 'pressIn');
      expect(onPressInMock).toHaveBeenCalled();

      fireEvent(button, 'pressOut');
      expect(onPressOutMock).toHaveBeenCalled();
  });
});
