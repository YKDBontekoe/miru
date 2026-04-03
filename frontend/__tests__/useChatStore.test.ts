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
    deleteRoom: jest.fn(),
    addAgentToRoom: jest.fn(),
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

it('automatically rejoins rooms when connected frame arrives', async () => {
  const roomId1 = '1';
  const roomId2 = '2';

  useChatStore.setState({ joinedRooms: { [roomId1]: true, [roomId2]: true } });

  const { result } = renderHook(() => useChatStore());

  // Connect hub to register the listener
  await act(async () => {
    await result.current.connectHub();
  });

  // Simulate the connected response arriving via the hub
  act(() => {
    capturedListener!({
      type: 'connected',
    });
  });

  expect(chatHub.joinRoom).toHaveBeenCalledWith(roomId1);
  expect(chatHub.joinRoom).toHaveBeenCalledWith(roomId2);
});

it('updates state when agent activity frame arrives via hub', async () => {
  const roomId = '1';

  const { result } = renderHook(() => useChatStore());

  // Connect hub to register the listener
  await act(async () => {
    await result.current.connectHub();
  });

  // Simulate the activity response arriving via the hub
  act(() => {
    capturedListener!({
      type: 'agent_activity',
      data: {
        room_id: roomId,
        agent_names: ['agent-1'],
        activity: 'thinking',
        detail: 'Searching...',
      },
    });
  });

  expect(result.current.agentActivity[roomId]).toEqual({
    room_id: roomId,
    agent_names: ['agent-1'],
    activity: 'thinking',
    detail: 'Searching...',
  });
});

it('disconnects and clears state properly', async () => {
  const { result } = renderHook(() => useChatStore());

  act(() => {
    result.current.disconnectHub();
  });

  expect(chatHub.disconnect).toHaveBeenCalled();
  expect(result.current.agentActivity).toEqual({ '1': null });
  expect(result.current.isStreaming).toBe(false);
  expect(result.current.joinedRooms).toEqual({});
});

it('handles error frames', async () => {
  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.connectHub();
  });

  act(() => {
    capturedListener!({
      type: 'error',
      data: {
        message: 'An error occurred',
      },
    });
  });

  expect(result.current.hubError).toBe('An error occurred');
});

it('can create a room', async () => {
  const mockRoom = { id: 'r1', name: 'New Room', created_at: '2023-01-01' };
  (ApiService.createRoom as jest.Mock).mockResolvedValue(mockRoom);
  const { result } = renderHook(() => useChatStore());

  let room;
  await act(async () => {
    room = await result.current.createRoom('New Room');
  });

  expect(room).toEqual(mockRoom);
  expect(result.current.rooms).toContainEqual(mockRoom);
});

it('can delete a room and rollback state', async () => {
  const mockRoom = { id: 'r1', name: 'New Room', created_at: '2023-01-01', updated_at: '2023-01-01' };
  (ApiService.deleteRoom as jest.Mock).mockResolvedValue(undefined);

  useChatStore.setState({
    rooms: [mockRoom],
    joinedRooms: { 'r1': true, 'r2': true },
    agentActivity: { 'r1': { room_id: 'r1', agent_names: ['Agent'], activity: 'thinking', detail: '' }, 'r2': null },
  });

  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.deleteRoom('r1');
  });

  expect(ApiService.deleteRoom).toHaveBeenCalledWith('r1');
  expect(result.current.rooms).not.toContainEqual(mockRoom);
  expect(result.current.joinedRooms['r1']).toBeUndefined();
  expect(result.current.agentActivity['r1']).toBeUndefined();
  expect(result.current.joinedRooms['r2']).toBe(true);
  expect(result.current.agentActivity['r2']).toBeNull();
});

it('deletes a room even if API throws', async () => {
  const mockRoom = { id: 'r1', name: 'New Room', created_at: '2023-01-01', updated_at: '2023-01-01' };
  (ApiService.deleteRoom as jest.Mock).mockRejectedValue(new Error('API error'));

  useChatStore.setState({
    rooms: [mockRoom],
    joinedRooms: { 'r1': true },
    agentActivity: { 'r1': { room_id: 'r1', agent_names: ['Agent'], activity: 'thinking', detail: '' } },
  });

  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.deleteRoom('r1');
  });

  expect(ApiService.deleteRoom).toHaveBeenCalledWith('r1');
  expect(result.current.rooms).not.toContainEqual(mockRoom);
  expect(result.current.joinedRooms['r1']).toBeUndefined();
  expect(result.current.agentActivity['r1']).toBeUndefined();
});

it('can add an agent to a room', async () => {
  (ApiService.addAgentToRoom as jest.Mock).mockResolvedValue({});
  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.addAgentToRoom('r1', 'a1');
  });

  expect(ApiService.addAgentToRoom).toHaveBeenCalledWith('r1', 'a1');
});

it('handles fetchRooms error', async () => {
  (ApiService.getRooms as jest.Mock).mockRejectedValue(new Error('error'));
  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.fetchRooms();
  });

  expect(result.current.hubError).toBe('error');
});

it('handles fetchMessages error', async () => {
  (ApiService.getRoomMessages as jest.Mock).mockRejectedValue(new Error('error'));
  const { result } = renderHook(() => useChatStore());

  await act(async () => {
    await result.current.fetchMessages('1');
  });

  expect(result.current.hubError).toBe('error');
});

it('stopStreaming clears agentActivity and isStreaming', async () => {
  useChatStore.setState({ agentActivity: { '1': {} as any }, isStreaming: true });
  const { result } = renderHook(() => useChatStore());

  act(() => {
    result.current.stopStreaming();
  });

  expect(result.current.agentActivity['1']).toBeNull();
  expect(result.current.isStreaming).toBe(false);
});

it('leaveRoom clears state', async () => {
  useChatStore.setState({
    agentActivity: { '1': {} as any },
    joinedRooms: { '1': true },
    isStreaming: true,
  });
  const { result } = renderHook(() => useChatStore());

  act(() => {
    result.current.leaveRoom('1');
  });

  expect(chatHub.leaveRoom).toHaveBeenCalledWith('1');
  expect(result.current.agentActivity['1']).toBeNull();
  expect(result.current.joinedRooms['1']).toBe(false);
  expect(result.current.isStreaming).toBe(false);
});
