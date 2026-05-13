import { SupabaseService, supabase } from '../src/core/services/supabase';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: '123' } } }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      setSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  })),
}));

describe('SupabaseService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('gets currentUser', async () => {
    const user = await SupabaseService.currentUser;
    expect(user.data.user?.id).toBe('1');
    expect(supabase.auth.getUser).toHaveBeenCalled();
  });

  it('gets currentSession', async () => {
    const session = await SupabaseService.currentSession;
    expect(session.data.session?.access_token).toBe('123');
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('signs in with magic link', async () => {
    await SupabaseService.signInWithMagicLink('test@example.com', 'redirect');
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { emailRedirectTo: 'redirect', shouldCreateUser: true },
    });
  });

  it('signs out', async () => {
    await SupabaseService.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('sets session from tokens', async () => {
    await SupabaseService.setSessionFromTokens('access', 'refresh');
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
  });
});
