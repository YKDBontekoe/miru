import { ApiService } from '../src/core/api/ApiService';
import { apiClient } from '../src/core/api/client';

jest.mock('../src/core/api/client', () => ({
  apiClient: {
    delete: jest.fn(),
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
});
