import { chatHub } from '../src/core/services/ChatHubService';
import { supabase } from '../src/core/services/supabase';

jest.mock('../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe('ChatHubService', () => {
  let mockWsInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
    chatHub.disconnect();

    mockWsInstance = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
    };

    global.WebSocket = jest.fn().mockImplementation(() => {
      // Allow ChatHubService to attach handlers
      setTimeout(() => {
        if (mockWsInstance.onopen) mockWsInstance.onopen();
      }, 0);
      return mockWsInstance;
    }) as unknown as typeof WebSocket;
    (global.WebSocket as any).OPEN = 1;
  });

  it('connects to websocket', async () => {
    await chatHub.connect();
    expect(chatHub.isConnected).toBe(true);
  });

  it('sends join room message', async () => {
    await chatHub.connect();
    chatHub.joinRoom('123');
    expect(mockWsInstance.send).toHaveBeenCalledWith(JSON.stringify({ type: 'join_room', room_id: '123' }));
  });

  it('sends leave room message', async () => {
    await chatHub.connect();
    chatHub.leaveRoom('123');
    expect(mockWsInstance.send).toHaveBeenCalledWith(JSON.stringify({ type: 'leave_room', room_id: '123' }));
  });

  it('sends regular message', async () => {
    await chatHub.connect();
    chatHub.sendMessage('123', 'content', 'tid');
    expect(mockWsInstance.send).toHaveBeenCalledWith(JSON.stringify({ type: 'send_message', room_id: '123', content: 'content', clientTempId: 'tid' }));
  });

  it('adds and calls listener', async () => {
    await chatHub.connect();
    const mockListener = jest.fn();
    const unsubscribe = chatHub.addListener(mockListener);

    mockWsInstance.onmessage({ data: JSON.stringify({ type: 'connected' }) });
    expect(mockListener).toHaveBeenCalledWith({ type: 'connected' });

    unsubscribe();
    mockWsInstance.onmessage({ data: JSON.stringify({ type: 'connected' }) });
    expect(mockListener).toHaveBeenCalledTimes(1);
  });
});
