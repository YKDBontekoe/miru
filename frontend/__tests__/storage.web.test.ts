import { SecureLocalStorage } from '../src/core/services/storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('SecureLocalStorage on Web', () => {
  let originalLocalStorage: any;
  let originalPlatform: any;

  beforeAll(() => {
    originalLocalStorage = global.localStorage;
    originalPlatform = require('react-native').Platform.OS;
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
    require('react-native').Platform.OS = 'web';
  });

  afterAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    require('react-native').Platform.OS = originalPlatform;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets item via localStorage', async () => {
    (global.localStorage.getItem as jest.Mock).mockReturnValueOnce('value');
    const result = await SecureLocalStorage.getItem('key');
    expect(result).toBe('value');
    expect(global.localStorage.getItem).toHaveBeenCalledWith('key');
  });

  it('sets item via localStorage', async () => {
    await SecureLocalStorage.setItem('key', 'value');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });

  it('removes item via localStorage', async () => {
    await SecureLocalStorage.removeItem('key');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('key');
  });
});
