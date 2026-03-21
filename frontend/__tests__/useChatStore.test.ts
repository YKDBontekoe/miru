import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '../src/store/useChatStore';
import { ApiService } from '../src/core/api/ApiService';
import { chatHub } from '../src/core/services/ChatHubService';

// Mock ApiService
jest.mock('../src/core/api/ApiService', () => ({
  ApiService: {
    getRooms: jest.fn(),
    getRoomMessages: jest.fn(),
    createRoom: jest.fn(),
  },
}));

// Mock ChatHubService
let capturedListener: ((frame: object) => void) | null = null;
jest.mock('../src/core/services/ChatHubService', () => ({
  chatHub: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendMessage: jest.fn(),
    get isConnected() {
      return true;
    },
    addListener: jest.fn().mockImplementation((listener) => {
      capturedListener = listener;
      return () => {
        capturedListener = null;
      };
    }),
  },
}));

describe('useChatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedListener = null;
    useChatStore.setState({
      rooms: [],
      messages: {},
      agentActivity: {},
      joinedRooms: {},
      hubError: null,
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

  it('blocks sendMessage and sets hubError when room is not joined', async () => {
    const roomId = '1';

    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.sendMessage(roomId, 'Hello');
    });

    expect(result.current.hubError).toBeTruthy();
    expect(result.current.messages[roomId]).toBeUndefined();
    expect(chatHub.sendMessage).not.toHaveBeenCalled();
  });

  it('adds optimistic message and calls hub when room is joined', async () => {
    const roomId = '1';

    useChatStore.setState({ joinedRooms: { [roomId]: true } });

    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.sendMessage(roomId, 'Hello');
    });

    const roomMessages = result.current.messages[roomId];
    expect(roomMessages).toHaveLength(1);
    expect(roomMessages[0].content).toBe('Hello');
    expect(roomMessages[0].user_id).toBe('me');
    expect(result.current.isStreaming).toBe(true);
    expect(chatHub.sendMessage).toHaveBeenCalledWith(roomId, 'Hello', expect.any(String));
  });

  it('updates state when agent message frame arrives via hub', async () => {
    const roomId = '1';

    useChatStore.setState({ joinedRooms: { [roomId]: true } });

    const { result } = renderHook(() => useChatStore());

    // Connect hub to register the listener
    await act(async () => {
      await result.current.connectHub();
    });

    // Send a message so isStreaming = true
    await act(async () => {
      await result.current.sendMessage(roomId, 'Hello');
    });

    expect(result.current.isStreaming).toBe(true);

    // Simulate the agent response arriving via the hub
    act(() => {
      capturedListener!({
        type: 'message',
        data: {
          id: 'agent-msg-1',
          room_id: roomId,
          user_id: null,
          agent_id: 'agent-1',
          content: 'How are you?',
          created_at: new Date().toISOString(),
        },
      });
    });

    const roomMessages = result.current.messages[roomId];
    const lastMessage = roomMessages[roomMessages.length - 1];
    expect(lastMessage.content).toBe('How are you?');
    expect(result.current.isStreaming).toBe(false);
  });
});
