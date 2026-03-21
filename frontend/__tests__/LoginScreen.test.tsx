import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import { useAuthStore } from '../src/store/useAuthStore';
import { Alert } from 'react-native';

// Mock useAuthStore
jest.mock('../src/store/useAuthStore');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockSignInWithMagicLink = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      signInWithMagicLink: mockSignInWithMagicLink,
    });
  });

  it('shows error if email is empty', async () => {
    const { getByText } = render(<LoginScreen />);
    const loginButton = getByText('Continue with Email');

    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email');
    expect(mockSignInWithMagicLink).not.toHaveBeenCalled();
  });

  it('calls signInWithMagicLink with email', async () => {
    mockSignInWithMagicLink.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const loginButton = getByText('Continue with Email');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com');
      expect(Alert.alert).toHaveBeenCalledWith('Success', expect.any(String));
    });
  });

  it('shows error alert if sign in fails', async () => {
    const errorMessage = 'Network error';
    mockSignInWithMagicLink.mockRejectedValueOnce(new Error(errorMessage));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const loginButton = getByText('Continue with Email');

    fireEvent.changeText(emailInput, 'fail@example.com');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', errorMessage);
    });
  });
});
