import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { supabase } from '../src/core/services/supabase';

// Mock supabase
jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    useAuthStore.setState({ user: null, session: null, isLoading: true });
  });

  it('initializes with null user and loading true', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('sets user when initialize is called', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc' };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      result.current.initialize();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles sign out', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
