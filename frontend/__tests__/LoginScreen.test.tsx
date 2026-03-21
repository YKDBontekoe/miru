import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock useAuthStore
jest.mock('../src/store/useAuthStore');

describe('LoginScreen', () => {
  const mockSignInWithMagicLink = jest.fn();
  const mockSignInWithPassword = jest.fn();
  const mockSignInWithPasskey = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      signInWithMagicLink: mockSignInWithMagicLink,
      signInWithPassword: mockSignInWithPassword,
      signInWithPasskey: mockSignInWithPasskey,
    });
  });

  it('shows error if email is empty on magic link', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Send magic link'));
    await waitFor(() => {
      expect(getByText('Please enter your email address')).toBeTruthy();
    });
    expect(mockSignInWithMagicLink).not.toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'notanemail');
    fireEvent.press(getByText('Send magic link'));
    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('calls signInWithMagicLink with valid email', async () => {
    mockSignInWithMagicLink.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.press(getByText('Send magic link'));
    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows error banner if sign in fails', async () => {
    const errorMessage = 'Network error';
    mockSignInWithMagicLink.mockRejectedValueOnce(new Error(errorMessage));
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'fail@example.com');
    fireEvent.press(getByText('Send magic link'));
    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
