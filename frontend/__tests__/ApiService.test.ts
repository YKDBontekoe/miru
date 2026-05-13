import { ApiService } from '../src/core/api/ApiService';
import { apiClient } from '../src/core/api/client';

jest.mock('../src/core/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('ApiService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteRoom', () => {
    it('should call the correct endpoint to delete a room', async () => {
      const roomId = 'test-room-123';
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await ApiService.deleteRoom(roomId);

      expect(apiClient.delete).toHaveBeenCalledWith(`rooms/${roomId}`);
      expect(apiClient.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMemories', () => {
    it('should call memory endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { memories: [] } });
      await ApiService.getMemories();
      expect(apiClient.get).toHaveBeenCalledWith('memory', { signal: undefined });
    });
  });

  describe('getAgents', () => {
    it('should call agents endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getAgents();
      expect(apiClient.get).toHaveBeenCalledWith('agents');
    });
  });

  describe('createAgent', () => {
    it('should call post agents endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.createAgent({ name: 'test' });
      expect(apiClient.post).toHaveBeenCalledWith('agents', { name: 'test' });
    });
  });

  describe('generateAgent', () => {
    it('should call generate agents endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.generateAgent('test');
      expect(apiClient.post).toHaveBeenCalledWith('agents/generate', { keywords: 'test' });
    });
  });

  describe('getRooms', () => {
    it('should call get rooms endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getRooms();
      expect(apiClient.get).toHaveBeenCalledWith('rooms');
    });
  });

  describe('createRoom', () => {
    it('should call create rooms endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.createRoom('test');
      expect(apiClient.post).toHaveBeenCalledWith('rooms', { name: 'test' });
    });
  });

  describe('getRoomSummaries', () => {
    it('should call room summaries endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getRoomSummaries(10);
      expect(apiClient.get).toHaveBeenCalledWith('rooms/summaries', { params: { limit: 10, before_id: undefined } });
    });
  });

  describe('getRoomMessages', () => {
    it('should call room messages endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getRoomMessages('123');
      expect(apiClient.get).toHaveBeenCalledWith('rooms/123/messages');
    });
  });

  describe('getRoomAgents', () => {
    it('should call room agents endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getRoomAgents('123');
      expect(apiClient.get).toHaveBeenCalledWith('rooms/123/agents');
    });
  });

  describe('addAgentToRoom', () => {
    it('should call post agent room endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.addAgentToRoom('123', '456');
      expect(apiClient.post).toHaveBeenCalledWith('rooms/123/agents', { agent_id: '456' });
    });
  });

  describe('removeAgentFromRoom', () => {
    it('should call delete agent room endpoint', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.removeAgentFromRoom('123', '456');
      expect(apiClient.delete).toHaveBeenCalledWith('rooms/123/agents/456');
    });
  });

  describe('updateAgent', () => {
    it('should call patch agent endpoint', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.updateAgent('123', { name: '456' });
      expect(apiClient.patch).toHaveBeenCalledWith('agents/123', { name: '456' });
    });
  });

  describe('deleteAgent', () => {
    it('should call delete agent endpoint', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.deleteAgent('123');
      expect(apiClient.delete).toHaveBeenCalledWith('agents/123');
    });
  });

  describe('getTemplates', () => {
    it('should call templates endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getTemplates();
      expect(apiClient.get).toHaveBeenCalledWith('agents/templates');
    });
  });

  describe('getNotes', () => {
    it('should call get notes endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getNotes();
      expect(apiClient.get).toHaveBeenCalledWith('productivity/notes', { signal: undefined });
    });
  });

  describe('createNote', () => {
    it('should call post note endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.createNote('t', 'c');
      expect(apiClient.post).toHaveBeenCalledWith('productivity/notes', { title: 't', content: 'c' });
    });
  });

  describe('deleteNote', () => {
    it('should call delete note endpoint', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.deleteNote('1');
      expect(apiClient.delete).toHaveBeenCalledWith('productivity/notes/1');
    });
  });

  describe('updateNote', () => {
    it('should call update note endpoint', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.updateNote('1', { title: 't' });
      expect(apiClient.patch).toHaveBeenCalledWith('productivity/notes/1', { title: 't' });
    });
  });

  describe('getTasks', () => {
    it('should call get tasks endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getTasks();
      expect(apiClient.get).toHaveBeenCalledWith('productivity/tasks', { signal: undefined });
    });
  });

  describe('createTask', () => {
    it('should call create task endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { is_completed: false } });
      await ApiService.createTask('t', '2026-05-13');
      expect(apiClient.post).toHaveBeenCalledWith('productivity/tasks', { title: 't', due_date: '2026-05-13' });
    });
  });

  describe('updateTask', () => {
    it('should call update task endpoint', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { is_completed: true } });
      await ApiService.updateTask('1', { completed: true });
      expect(apiClient.patch).toHaveBeenCalledWith('productivity/tasks/1', { is_completed: true });
    });
  });

  describe('deleteTask', () => {
    it('should call delete task endpoint', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.deleteTask('1');
      expect(apiClient.delete).toHaveBeenCalledWith('productivity/tasks/1');
    });
  });

  describe('getEvents', () => {
    it('should call get events endpoint', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await ApiService.getEvents();
      expect(apiClient.get).toHaveBeenCalledWith('productivity/events', { signal: undefined });
    });
  });

  describe('deleteMemory', () => {
    it('should call delete memory endpoint', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await ApiService.deleteMemory('1');
      expect(apiClient.delete).toHaveBeenCalledWith('memory/1');
    });
  });

});
