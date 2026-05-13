import { apiClient, waitForBackend } from '../src/core/api/client';
import { supabase } from '../src/core/services/supabase';
import { useAppStore } from '../src/store/useAppStore';

jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('../src/store/useAppStore', () => ({
  useAppStore: {
    getState: jest.fn(),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore.getState as jest.Mock).mockReturnValue({ baseUrl: 'http://test.com' });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('intercepts request to add auth token and base url', async () => {
    const config = { headers: {} as any } as any;
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const result = await interceptor(config);
    expect(result.baseURL).toBe('http://test.com/');
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('intercepts response errors and rejects', async () => {
    const error = { response: { status: 401 } };
    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    await expect(interceptor(error)).rejects.toEqual(error);
  });
});

describe('waitForBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore.getState as jest.Mock).mockReturnValue({ baseUrl: 'http://test.com' });
  });

  it('resolves when fetch succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });
    await expect(waitForBackend(2, 1)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith('http://test.com/health', { method: 'GET' });
  });

  it('throws after max attempts', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    await expect(waitForBackend(2, 1)).rejects.toThrow('Failed to reach backend after 2 attempts');
  });
});
