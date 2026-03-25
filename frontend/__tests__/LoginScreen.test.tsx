import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock useAuthStore
jest.mock('../src/store/useAuthStore');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'auth.errors.email_required': 'Please enter your email address',
        'auth.errors.email_invalid': 'Please enter a valid email address',
        'auth.btn_magic_link': 'Send magic link',
        'auth.email_placeholder': 'you@example.com',
        'auth.errors.magic_link_failed': 'Failed to send magic link. Please try again.',
        'auth.desc_magic_link': 'Sign in with a one-time link sent to your email.',
        'auth.desc_password': 'Sign in with your email and password.',
        'auth.desc_passkey': 'Sign in with your biometrics or security key.',
        'auth.email_label': 'Email address',
        'auth.password_label': 'Password',
        'auth.passkey_hint':
          'Your device will prompt you to authenticate with Face ID, Touch ID, or a security key.',
        'auth.footer_note':
          'By signing in you agree to keep your account secure.\nMagic links expire after 1 hour.',
      };
      return keys[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

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
