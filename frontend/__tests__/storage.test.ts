import { SecureLocalStorage } from '../src/core/services/storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('SecureLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform.OS to default
    (Platform as { OS: string }).OS = 'ios';
  });

  describe('getItem', () => {
    it('should use SecureStore on mobile platforms', async () => {
      (Platform as { OS: string }).OS = 'ios';
      const mockValue = 'test-value';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockValue);

      const result = await SecureLocalStorage.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('should use localStorage on web platform', async () => {
      (Platform as { OS: string }).OS = 'web';
      const mockValue = 'web-value';
      
      // Mock localStorage
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(mockValue),
        },
        writable: true,
      });

      const result = await SecureLocalStorage.getItem('test-key');

      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('should return null when localStorage is undefined on web', async () => {
      (Platform as { OS: string }).OS = 'web';
      
      // Mock localStorage as undefined
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = await SecureLocalStorage.getItem('test-key');

      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should use SecureStore on mobile platforms', async () => {
      (Platform as { OS: string }).OS = 'ios';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await SecureLocalStorage.setItem('test-key', 'test-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should use localStorage on web platform', async () => {
      (Platform as { OS: string }).OS = 'web';
      const mockSetItem = jest.fn();
      
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: mockSetItem,
        },
        writable: true,
      });

      await SecureLocalStorage.setItem('test-key', 'test-value');

      expect(mockSetItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should handle undefined localStorage gracefully on web', async () => {
      (Platform as { OS: string }).OS = 'web';
      
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Should not throw
      await expect(SecureLocalStorage.setItem('test-key', 'test-value')).resolves.toBeUndefined();
    });
  });

  describe('removeItem', () => {
    it('should use SecureStore on mobile platforms', async () => {
      (Platform as { OS: string }).OS = 'ios';
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await SecureLocalStorage.removeItem('test-key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should use localStorage on web platform', async () => {
      (Platform as { OS: string }).OS = 'web';
      const mockRemoveItem = jest.fn();
      
      Object.defineProperty(global, 'localStorage', {
        value: {
          removeItem: mockRemoveItem,
        },
        writable: true,
      });

      await SecureLocalStorage.removeItem('test-key');

      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle undefined localStorage gracefully on web', async () => {
      (Platform as { OS: string }).OS = 'web';
      
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Should not throw
      await expect(SecureLocalStorage.removeItem('test-key')).resolves.toBeUndefined();
    });
  });

  describe('platform-specific behavior', () => {
    it('should work on Android', async () => {
      (Platform as { OS: string }).OS = 'android';
      const mockValue = 'android-value';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockValue);

      const result = await SecureLocalStorage.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('should work on iOS', async () => {
      (Platform as { OS: string }).OS = 'ios';
      const mockValue = 'ios-value';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockValue);

      const result = await SecureLocalStorage.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });
  });
});
