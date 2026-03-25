import { SupabaseService, supabase } from '../src/core/services/supabase';

// Mock @supabase/supabase-js
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockSignOut = jest.fn();
const mockSetSession = jest.fn();
const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      signOut: mockSignOut,
      setSession: mockSetSession,
      startAutoRefresh: mockStartAutoRefresh,
      stopAutoRefresh: mockStopAutoRefresh,
    },
  })),
}));

// Mock storage service
jest.mock('../src/core/services/storage', () => ({
  SecureLocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Mock react-native AppState
const mockAddEventListener = jest.fn();
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  AppState: {
    addEventListener: mockAddEventListener,
  },
}));

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('currentUser', () => {
    it('should call getUser', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await SupabaseService.currentUser;

      expect(mockGetUser).toHaveBeenCalled();
      expect(result.data.user).toEqual(mockUser);
    });

    it('should handle getUser errors', async () => {
      const mockError = new Error('Auth error');
      mockGetUser.mockResolvedValue({ data: { user: null }, error: mockError });

      const result = await SupabaseService.currentUser;

      expect(mockGetUser).toHaveBeenCalled();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('currentSession', () => {
    it('should call getSession', async () => {
      const mockSession = { access_token: 'token-123', refresh_token: 'refresh-123' };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const result = await SupabaseService.currentSession;

      expect(mockGetSession).toHaveBeenCalled();
      expect(result.data.session).toEqual(mockSession);
    });

    it('should handle getSession errors', async () => {
      const mockError = new Error('Session error');
      mockGetSession.mockResolvedValue({ data: { session: null }, error: mockError });

      const result = await SupabaseService.currentSession;

      expect(mockGetSession).toHaveBeenCalled();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signInWithMagicLink', () => {
    it('should sign in with email', async () => {
      const email = 'test@example.com';
      mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

      const result = await SupabaseService.signInWithMagicLink(email);

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
        },
      });
      expect(result.error).toBeNull();
    });

    it('should sign in with email and redirect', async () => {
      const email = 'test@example.com';
      const redirectTo = 'https://example.com/callback';
      mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

      const result = await SupabaseService.signInWithMagicLink(email, redirectTo);

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });
      expect(result.error).toBeNull();
    });

    it('should handle sign in errors', async () => {
      const email = 'test@example.com';
      const mockError = new Error('Sign in failed');
      mockSignInWithOtp.mockResolvedValue({ data: null, error: mockError });

      const result = await SupabaseService.signInWithMagicLink(email);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await SupabaseService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockResolvedValue({ error: mockError });

      const result = await SupabaseService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('setSessionFromTokens', () => {
    it('should set session from tokens', async () => {
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-123';
      mockSetSession.mockResolvedValue({ data: {}, error: null });

      const result = await SupabaseService.setSessionFromTokens(accessToken, refreshToken);

      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(result.error).toBeNull();
    });

    it('should handle set session errors', async () => {
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-123';
      const mockError = new Error('Invalid tokens');
      mockSetSession.mockResolvedValue({ data: null, error: mockError });

      const result = await SupabaseService.setSessionFromTokens(accessToken, refreshToken);

      expect(mockSetSession).toHaveBeenCalled();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('AppState event listener', () => {
    it('should register AppState listener on module load', () => {
      // The listener is registered when the module loads, so we just verify it was called
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should start auto refresh when app becomes active', () => {
      // Get the registered callback
      const calls = mockAddEventListener.mock.calls;
      const appStateCallback = calls.find(call => call[0] === 'change')?.[1];
      
      expect(appStateCallback).toBeDefined();
      
      // Simulate app becoming active
      appStateCallback('active');
      
      expect(mockStartAutoRefresh).toHaveBeenCalled();
    });

    it('should stop auto refresh when app becomes inactive', () => {
      // Get the registered callback
      const calls = mockAddEventListener.mock.calls;
      const appStateCallback = calls.find(call => call[0] === 'change')?.[1];
      
      expect(appStateCallback).toBeDefined();
      
      // Simulate app becoming inactive
      appStateCallback('inactive');
      
      expect(mockStopAutoRefresh).toHaveBeenCalled();
    });

    it('should stop auto refresh when app goes to background', () => {
      // Get the registered callback
      const calls = mockAddEventListener.mock.calls;
      const appStateCallback = calls.find(call => call[0] === 'change')?.[1];
      
      expect(appStateCallback).toBeDefined();
      
      // Simulate app going to background
      appStateCallback('background');
      
      expect(mockStopAutoRefresh).toHaveBeenCalled();
    });
  });
});
