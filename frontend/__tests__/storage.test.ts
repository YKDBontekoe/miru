import { SecureLocalStorage } from '../src/core/services/storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('SecureLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets item via async', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('value');
    const result = await SecureLocalStorage.getItem('key');
    expect(result).toBe('value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
  });

  it('sets item via async', async () => {
    await SecureLocalStorage.setItem('key', 'value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
  });

  it('removes item via async', async () => {
    await SecureLocalStorage.removeItem('key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
  });
});
