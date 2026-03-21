import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../src/components/AppButton';

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

  it('is disabled when isLoading is true', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <AppButton label="Wait" isLoading={true} onPress={onPressMock} />
    );
    const button = getByTestId('app-button');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
