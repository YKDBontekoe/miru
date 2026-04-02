import { act, renderHook } from '@testing-library/react-native';
import { useMemoryStore } from '../src/store/useMemoryStore';
import { ApiService } from '../src/core/api/ApiService';
import { Memory } from '../src/core/models';

jest.mock('../src/core/api/ApiService', () => ({
  ApiService: {
    getMemories: jest.fn(),
    deleteMemory: jest.fn(),
  },
}));

describe('useMemoryStore', () => {
  beforeEach(() => {
    useMemoryStore.setState({ memories: [], isLoading: false });
    jest.clearAllMocks();
  });

  const mockMemory: Memory = {
    id: 'mem-123',
    content: 'User likes red',
    category: 'preference',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('fetchMemories updates state with fetched memories', async () => {
    (ApiService.getMemories as jest.Mock).mockResolvedValueOnce([mockMemory]);

    const { result } = renderHook(() => useMemoryStore());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.fetchMemories();
    });

    expect(ApiService.getMemories).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.memories).toEqual([mockMemory]);
  });

  it('fetchMemories handles errors gracefully', async () => {
    (ApiService.getMemories as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Silence console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useMemoryStore());

    await act(async () => {
      await result.current.fetchMemories();
    });

    expect(ApiService.getMemories).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.memories).toEqual([]);

    (console.error as jest.Mock).mockRestore();
  });

  it('deleteMemory handles non-existent memory gracefully', async () => {
    const { result } = renderHook(() => useMemoryStore());

    await act(async () => {
      await result.current.deleteMemory('mem-999');
    });

    expect(ApiService.deleteMemory).not.toHaveBeenCalled();
  });

  it('deleteMemory optimistically removes memory and succeeds', async () => {
    useMemoryStore.setState({ memories: [mockMemory] });
    (ApiService.deleteMemory as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() => useMemoryStore());

    await act(async () => {
      await result.current.deleteMemory('mem-123');
    });

    expect(ApiService.deleteMemory).toHaveBeenCalledWith('mem-123');
    expect(result.current.memories).toEqual([]);
  });

  it('deleteMemory rolls back on failure', async () => {
    useMemoryStore.setState({ memories: [mockMemory] });
    (ApiService.deleteMemory as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useMemoryStore());

    let error;
    await act(async () => {
      try {
        await result.current.deleteMemory('mem-123');
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeDefined();
    expect(ApiService.deleteMemory).toHaveBeenCalledWith('mem-123');
    // Memory should be restored
    expect(result.current.memories).toEqual([mockMemory]);
  });
});
