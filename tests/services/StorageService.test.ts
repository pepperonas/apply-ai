import { StorageService } from '../../src/services/StorageService';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = null;
  });

  describe('save', () => {
    it('should save data successfully', async () => {
      const mockSet = jest.fn((data, callback) => callback());
      (chrome.storage.sync.set as jest.Mock) = mockSet;

      await StorageService.save('testKey', { value: 'test' });

      expect(mockSet).toHaveBeenCalledWith(
        { testKey: { value: 'test' } },
        expect.any(Function)
      );
    });

    it('should reject on error', async () => {
      const mockError = { message: 'Storage error' };
      chrome.runtime.lastError = mockError;

      const mockSet = jest.fn((data, callback) => callback());
      (chrome.storage.sync.set as jest.Mock) = mockSet;

      await expect(
        StorageService.save('testKey', 'test')
      ).rejects.toEqual(mockError);

      chrome.runtime.lastError = null;
    });
  });

  describe('load', () => {
    it('should load data successfully', async () => {
      const mockData = { testKey: 'testValue' };
      const mockGet = jest.fn((keys, callback) => callback(mockData));
      (chrome.storage.sync.get as jest.Mock) = mockGet;

      const result = await StorageService.load('testKey');

      expect(result).toBe('testValue');
    });

    it('should return null for non-existent key', async () => {
      const mockGet = jest.fn((keys, callback) => callback({}));
      (chrome.storage.sync.get as jest.Mock) = mockGet;

      const result = await StorageService.load('nonExistent');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove data successfully', async () => {
      const mockRemove = jest.fn((key, callback) => callback());
      (chrome.storage.sync.remove as jest.Mock) = mockRemove;

      await StorageService.remove('testKey');

      expect(mockRemove).toHaveBeenCalledWith('testKey', expect.any(Function));
    });
  });
});

