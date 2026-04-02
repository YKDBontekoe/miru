import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useMemoryStore } from '../src/store/useMemoryStore';
import { supabase } from '../src/core/services/supabase';

// Mock supabase
jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithOtp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    useAuthStore.setState({ user: null, session: null, isLoading: true });
    useMemoryStore.setState({ memories: [{ id: '1', content: 'test', created_at: '', metadata: {} }] });
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

  it('handles sign out and clears memory cache', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Verify initial memories exist
    const initialMemories = useMemoryStore.getState().memories;
    expect(initialMemories.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();

    // Verify memory store was cleared
    const clearedMemories = useMemoryStore.getState().memories;
    expect(clearedMemories).toEqual([]);
  });

  it('handles sign in with magic link', async () => {
    (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.signInWithMagicLink('test@example.com');
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: expect.any(Object),
    });
  });

  it('handles sign in with password', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'abc' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.signInWithPassword('test@example.com', 'password123');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });
});
