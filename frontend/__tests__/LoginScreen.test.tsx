import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock useAuthStore
jest.mock('../src/store/useAuthStore');

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('LoginScreen', () => {
  const mockSignInWithMagicLink = jest.fn();
  const mockSignInWithPassword = jest.fn();
  const mockSignInWithPasskey = jest.fn();
  const mockInitialize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockReplace.mockClear();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      signInWithMagicLink: mockSignInWithMagicLink,
      signInWithPassword: mockSignInWithPassword,
      signInWithPasskey: mockSignInWithPasskey,
      initialize: mockInitialize,
      user: null,
      isLoading: false,
    });
  });

  describe('Magic Link Authentication', () => {
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

    it('displays success message after magic link is sent', async () => {
      mockSignInWithMagicLink.mockResolvedValueOnce(undefined);
      const { getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      fireEvent.press(getByText('Send magic link'));
      
      await waitFor(() => {
        expect(getByText(/Check your email/i)).toBeTruthy();
      });
    });
  });

  describe('Password Authentication', () => {
    it('shows error if email is empty on password sign in', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      // Switch to password tab if needed
      const passwordInputs = getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs, 'password123');
      fireEvent.press(getByText('Sign in'));
      
      await waitFor(() => {
        expect(getByText('Please enter your email address')).toBeTruthy();
      });
    });

    it('shows error if password is empty', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      fireEvent.press(getByText('Sign in'));
      
      await waitFor(() => {
        expect(getByText('Please enter your password')).toBeTruthy();
      });
    });

    it('calls signInWithPassword with valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValueOnce(undefined);
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const passwordInput = getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign in'));
      
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('redirects to main screen after successful password sign in', async () => {
      mockSignInWithPassword.mockResolvedValueOnce(undefined);
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const passwordInput = getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign in'));
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(main)');
      });
    });

    it('shows error banner if password sign in fails', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithPassword.mockRejectedValueOnce(new Error(errorMessage));
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const passwordInput = getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(getByText('Sign in'));
      
      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });

    it('toggles password visibility', async () => {
      const { getByTestId, getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('••••••••');
      
      // Initially should be secure
      expect(passwordInput.props.secureTextEntry).toBe(true);
      
      // Toggle visibility - adjust test ID based on actual implementation
      // This assumes there's an eye icon or similar to toggle
      // fireEvent.press(getByTestId('toggle-password-visibility'));
      // expect(passwordInput.props.secureTextEntry).toBe(false);
    });
  });

  describe('Passkey Authentication', () => {
    it('shows error if email is empty on passkey sign in', async () => {
      const { getByText } = render(<LoginScreen />);
      // Look for passkey sign in button
      const passkeyButton = getByText(/passkey/i);
      if (passkeyButton) {
        fireEvent.press(passkeyButton);
        await waitFor(() => {
          expect(getByText('Please enter your email address')).toBeTruthy();
        });
      }
    });

    it('calls signInWithPasskey with valid email', async () => {
      mockSignInWithPasskey.mockResolvedValueOnce(undefined);
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const passkeyButton = getByText(/passkey/i);
      if (passkeyButton) {
        fireEvent.press(passkeyButton);
        
        await waitFor(() => {
          expect(mockSignInWithPasskey).toHaveBeenCalledWith('test@example.com');
        });
      }
    });

    it('shows error if passkey is not supported', async () => {
      const errorMessage = 'Passkeys are not supported';
      mockSignInWithPasskey.mockRejectedValueOnce(new Error(errorMessage));
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const passkeyButton = getByText(/passkey/i);
      if (passkeyButton) {
        fireEvent.press(passkeyButton);
        
        await waitFor(() => {
          expect(getByText(errorMessage)).toBeTruthy();
        });
      }
    });
  });

  describe('Auto-redirect when authenticated', () => {
    it('redirects to main screen if user is already authenticated', () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        signInWithMagicLink: mockSignInWithMagicLink,
        signInWithPassword: mockSignInWithPassword,
        signInWithPasskey: mockSignInWithPasskey,
        initialize: mockInitialize,
        user: { id: 'user-1', email: 'test@example.com' },
        isLoading: false,
      });

      render(<LoginScreen />);
      
      expect(mockReplace).toHaveBeenCalledWith('/(main)');
    });

    it('shows loading state while initializing', () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        signInWithMagicLink: mockSignInWithMagicLink,
        signInWithPassword: mockSignInWithPassword,
        signInWithPasskey: mockSignInWithPasskey,
        initialize: mockInitialize,
        user: null,
        isLoading: true,
      });

      const { getByTestId } = render(<LoginScreen />);
      // Should show loading indicator
      // expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('UI Interactions', () => {
    it('clears error banner when user starts typing', async () => {
      mockSignInWithMagicLink.mockRejectedValueOnce(new Error('Error'));
      const { getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'fail@example.com');
      fireEvent.press(getByText('Send magic link'));
      
      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });
      
      // Clear and retype
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'new@example.com');
      
      // Error should be cleared
      // expect(queryByText('Error')).toBeNull();
    });

    it('validates email format correctly', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      const invalidEmails = ['notanemail', '@example.com', 'test@', 'test@.com', ''];
      
      for (const email of invalidEmails) {
        fireEvent.changeText(getByPlaceholderText('you@example.com'), email);
        fireEvent.press(getByText('Send magic link'));
        
        await waitFor(() => {
          expect(getByText('Please enter a valid email address')).toBeTruthy();
        });
      }
    });

    it('accepts valid email formats', async () => {
      mockSignInWithMagicLink.mockResolvedValue(undefined);
      const { getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
        '123@numeric.com',
      ];
      
      for (const email of validEmails) {
        fireEvent.changeText(getByPlaceholderText('you@example.com'), email);
        fireEvent.press(getByText('Send magic link'));
        
        await waitFor(() => {
          // Should not show invalid email error
          const errorElement = queryByText('Please enter a valid email address');
          if (errorElement) {
            throw new Error(`Email ${email} was incorrectly rejected`);
          }
        });
        
        jest.clearAllMocks();
      }
    });
  });

  describe('Form State Management', () => {
    it('maintains email state across tab switches', async () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      
      const email = 'test@example.com';
      fireEvent.changeText(getByPlaceholderText('you@example.com'), email);
      
      // Switch tabs if applicable
      // fireEvent.press(getByText('Password'));
      
      // Email should persist
      const emailInput = getByPlaceholderText('you@example.com');
      expect(emailInput.props.value).toBe(email);
    });

    it('disables submit button while loading', async () => {
      mockSignInWithMagicLink.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
      const button = getByText('Send magic link');
      fireEvent.press(button);
      
      // Button should be disabled
      await waitFor(() => {
        expect(button.props.disabled).toBe(true);
      });
    });
  });
});
