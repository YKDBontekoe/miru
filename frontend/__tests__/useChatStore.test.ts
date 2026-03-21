import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '../src/store/useChatStore';
import { ApiService } from '../src/core/api/ApiService';

// Mock ApiService
jest.mock('../src/core/api/ApiService', () => ({
  ApiService: {
    getRooms: jest.fn(),
    getRoomMessages: jest.fn(),
    createRoom: jest.fn(),
    streamRoomChat: jest.fn(),
  },
}));

describe('useChatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({
      rooms: [],
      messages: {},
      isLoadingRooms: false,
      isLoadingMessages: false,
      isStreaming: false,
    });
  });

  it('fetches rooms successfully', async () => {
    const mockRooms = [{ id: '1', name: 'Room 1', created_at: '2023-01-01' }];
    (ApiService.getRooms as jest.Mock).mockResolvedValue(mockRooms);

    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.fetchRooms();
    });

    expect(result.current.rooms).toEqual(mockRooms);
    expect(result.current.isLoadingRooms).toBe(false);
  });

  it('fetches messages for a room', async () => {
    const roomId = '1';
    const mockMessages = [
      { id: 'm1', room_id: roomId, content: 'Hello', created_at: '2023-01-01', status: 'sent' },
    ];
    (ApiService.getRoomMessages as jest.Mock).mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.fetchMessages(roomId);
    });

    expect(result.current.messages[roomId]).toEqual(mockMessages);
  });

  it('updates state during streaming chat', async () => {
    const roomId = '1';
    const content = 'Hello';

    // Mock streamRoomChat to call onChunk several times
    (ApiService.streamRoomChat as jest.Mock).mockImplementation((rid, text, onChunk) => {
      onChunk('How ');
      onChunk('are ');
      onChunk('you?');
      return Promise.resolve();
    });

    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.sendMessage(roomId, content);
    });

    const roomMessages = result.current.messages[roomId];
    // Last message should be the assistant's response
    const lastMessage = roomMessages[roomMessages.length - 1];
    expect(lastMessage.content).toBe('How are you?');
    expect(result.current.isStreaming).toBe(false);
  });
});
