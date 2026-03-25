import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock supabase
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSetSession = jest.fn();

jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithOtp: mockSignInWithOtp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      setSession: mockSetSession,
    },
  },
}));

// Mock API client
const mockPost = jest.fn();
jest.mock('../src/core/api/client', () => ({
  apiClient: {
    post: mockPost,
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
    });
  });

  describe('initialize', () => {
    it('should initialize with session if available', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
    });

    it('should initialize without session if not available', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should update state when auth state changes', async () => {
      const initialSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      mockGetSession.mockResolvedValue({ data: { session: initialSession }, error: null });
      
      let authStateCallback: ((event: string, session: typeof initialSession | null) => void) | null = null;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate auth state change
      const newSession = {
        access_token: 'new-token-456',
        refresh_token: 'new-refresh-456',
        user: { id: 'user-2', email: 'new@example.com' },
      };

      act(() => {
        if (authStateCallback) {
          authStateCallback('SIGNED_IN', newSession);
        }
      });

      expect(result.current.session).toEqual(newSession);
      expect(result.current.user).toEqual(newSession.user);
    });
  });

  describe('signInWithMagicLink', () => {
    it('should sign in with magic link successfully', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithMagicLink('test@example.com');
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'miru://login-callback',
        },
      });
    });

    it('should throw error when sign in fails', async () => {
      const mockError = new Error('Sign in failed');
      mockSignInWithOtp.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.signInWithMagicLink('test@example.com')).rejects.toThrow('Sign in failed');
    });
  });

  describe('signInWithPassword', () => {
    it('should sign in with password and update store', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      mockSignInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithPassword('test@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
    });

    it('should not update store if session is null', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { session: null }, error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithPassword('test@example.com', 'password123');
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should throw error when password sign in fails', async () => {
      const mockError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ data: {}, error: mockError });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.signInWithPassword('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signInWithPasskey', () => {
    it('should sign in with passkey successfully', async () => {
      const mockChallengeResponse = {
        data: {
          challenge_id: 'challenge-123',
          options: { challenge: 'base64challenge' },
        },
      };
      const mockVerifyResponse = {
        data: {
          access_token: 'token-123',
          refresh_token: 'refresh-123',
        },
      };
      
      mockPost
        .mockResolvedValueOnce(mockChallengeResponse)
        .mockResolvedValueOnce(mockVerifyResponse);
      
      mockSetSession.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithPasskey('test@example.com');
      });

      expect(mockPost).toHaveBeenCalledWith('auth/passkey/login/options', { email: 'test@example.com' });
    });

    it('should throw error when passkey is not supported', async () => {
      const mockChallengeResponse = {
        data: {
          challenge_id: 'challenge-123',
          options: { challenge: 'base64challenge' },
        },
      };
      
      mockPost.mockResolvedValueOnce(mockChallengeResponse);
      
      // Simulate Passkey module not being available
      jest.mock('react-native-passkeys', () => {
        throw new Error('Module not found');
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.signInWithPasskey('test@example.com')).rejects.toThrow(
        'Passkeys are not supported on this device or build'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out and clear store', async () => {
      // Set initial state with user
      useAuthStore.setState({
        user: { id: 'user-1', email: 'test@example.com' } as any,
        session: { access_token: 'token' } as any,
        isLoading: false,
      });
      
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuthStore());

      await expect(result.current.signOut()).rejects.toThrow('Sign out failed');
    });
  });
});
