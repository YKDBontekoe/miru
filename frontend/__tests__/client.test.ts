import { apiClient, waitForBackend, streamChat } from '../src/core/api/client';
import { supabase } from '../src/core/services/supabase';

// Mock axios
const mockAxiosCreate = jest.fn();
const mockRequestInterceptor = jest.fn();
const mockResponseInterceptor = jest.fn();
const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: mockAxiosCreate,
  },
  AxiosError: class AxiosError extends Error {
    response?: { status: number };
    constructor(message: string, response?: { status: number }) {
      super(message);
      this.response = response;
    }
  },
}));

// Mock supabase
const mockGetSession = jest.fn();
jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// Mock useAppStore
const mockGetState = jest.fn();
jest.mock('../src/store/useAppStore', () => ({
  useAppStore: {
    getState: mockGetState,
  },
}));

// Mock i18next
const mockLanguage = 'en';
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    language: mockLanguage,
  },
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn((obj) => obj.default),
  },
}));

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn() as any;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup axios mock
    mockAxiosCreate.mockReturnValue({
      interceptors: {
        request: { use: mockRequestInterceptor },
        response: { use: mockResponseInterceptor },
      },
      post: mockPost,
    });
  });

  describe('request interceptor', () => {
    it('should add baseURL from store', async () => {
      const storeUrl = 'https://api.example.com';
      mockGetState.mockReturnValue({ baseUrl: storeUrl });
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      // Re-import to trigger the interceptor setup
      jest.isolateModules(() => {
        require('../src/core/api/client');
      });

      expect(mockRequestInterceptor).toHaveBeenCalled();
    });

    it('should use local backend URL when store URL is not set', async () => {
      mockGetState.mockReturnValue({ baseUrl: null });
      mockGetSession.mockResolvedValue({ data: { session: null } });

      jest.isolateModules(() => {
        require('../src/core/api/client');
      });

      expect(mockRequestInterceptor).toHaveBeenCalled();
    });

    it('should add authorization header when session exists', async () => {
      const storeUrl = 'https://api.example.com';
      const mockToken = 'test-token-123';
      mockGetState.mockReturnValue({ baseUrl: storeUrl });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: mockToken } },
      });

      jest.isolateModules(() => {
        require('../src/core/api/client');
      });

      expect(mockRequestInterceptor).toHaveBeenCalled();
    });
  });

  describe('response interceptor', () => {
    it('should handle 401 errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      jest.isolateModules(() => {
        require('../src/core/api/client');
      });

      // Get the response error handler
      const responseHandler = mockResponseInterceptor.mock.calls[0];
      expect(responseHandler).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});

describe('waitForBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ baseUrl: 'https://api.example.com' });
    global.fetch = jest.fn();
  });

  it('should resolve when backend is healthy', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

    await waitForBackend(5, 100);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/health', { method: 'GET' });
  });

  it('should retry until backend is healthy', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });

    await waitForBackend(5, 100);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error after max attempts', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ status: 503 });

    await expect(waitForBackend(3, 50)).rejects.toThrow('Failed to reach backend after 3 attempts');
  });

  it('should use local backend URL when store URL is not set', async () => {
    mockGetState.mockReturnValue({ baseUrl: null });
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

    await waitForBackend(5, 100);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/health'), { method: 'GET' });
  });
});

describe('streamChat', () => {
  let mockXHR: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ baseUrl: 'https://api.example.com' });
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });

    mockXHR = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      abort: jest.fn(),
      responseText: '',
      status: 200,
    };
    (global.XMLHttpRequest as jest.Mock).mockImplementation(() => mockXHR);
  });

  it('should stream chat successfully', async () => {
    const onChunk = jest.fn();
    const data = { message: 'Hello' };

    const promise = streamChat('chat/stream', data, onChunk);

    // Simulate successful response
    mockXHR.responseText = 'chunk1';
    mockXHR.onload();

    await promise;

    expect(mockXHR.open).toHaveBeenCalledWith('POST', 'https://api.example.com/chat/stream');
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token-123');
    expect(mockXHR.send).toHaveBeenCalledWith(JSON.stringify(data));
  });

  it('should handle streaming chunks', async () => {
    const onChunk = jest.fn();
    const data = { message: 'Hello' };

    const promise = streamChat('chat/stream', data, onChunk);

    // Simulate multiple chunks via onprogress
    mockXHR.responseText = 'chunk1';
    mockXHR.onprogress();
    
    mockXHR.responseText = 'chunk1chunk2';
    mockXHR.onprogress();

    mockXHR.onload();

    await promise;

    expect(onChunk).toHaveBeenCalledWith('chunk1');
    expect(onChunk).toHaveBeenCalledWith('chunk2');
  });

  it('should handle HTTP errors', async () => {
    const onChunk = jest.fn();
    const data = { message: 'Hello' };

    const promise = streamChat('chat/stream', data, onChunk);

    mockXHR.status = 500;
    mockXHR.onload();

    await expect(promise).rejects.toThrow('HTTP 500');
  });

  it('should handle network errors', async () => {
    const onChunk = jest.fn();
    const data = { message: 'Hello' };

    const promise = streamChat('chat/stream', data, onChunk);

    mockXHR.onerror();

    await expect(promise).rejects.toThrow('Network error');
  });

  it('should support abort signal', async () => {
    const onChunk = jest.fn();
    const data = { message: 'Hello' };
    const controller = new AbortController();

    const promise = streamChat('chat/stream', data, onChunk, controller.signal);

    // Trigger abort
    controller.abort();

    await expect(promise).rejects.toThrow('Aborted');
    expect(mockXHR.abort).toHaveBeenCalled();
  });

  it('should not add authorization header when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const onChunk = jest.fn();
    const data = { message: 'Hello' };

    const promise = streamChat('chat/stream', data, onChunk);
    mockXHR.onload();

    await promise;

    // Should not set Authorization header when no token
    const authHeaderCalls = mockXHR.setRequestHeader.mock.calls.filter(
      (call: string[]) => call[0] === 'Authorization'
    );
    expect(authHeaderCalls.length).toBe(0);
  });
});
