import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, isValidTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Replace the global sessionStorage with our mock
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todo array', () => {
      const validTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      expect(isValidTodos(validTodos)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for non-array', () => {
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
      expect(isValidTodos('string')).toBe(false);
      expect(isValidTodos(123)).toBe(false);
      expect(isValidTodos({})).toBe(false);
    });

    it('should return false for array with invalid todo objects', () => {
      const invalidTodos = [
        {
          id: '1',
          title: 'Valid Todo',
          description: 'Valid Description',
          completed: false,
          createdAt: new Date(),
        },
        {
          // missing required fields
          id: '2',
          title: 'Invalid Todo',
        },
      ];

      expect(isValidTodos(invalidTodos)).toBe(false);
    });

    it('should return false for todo with wrong field types', () => {
      const invalidTodos = [
        {
          id: 123, // should be string
          title: 'Invalid Todo',
          description: 'Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      expect(isValidTodos(invalidTodos)).toBe(false);
    });

    it('should accept createdAt as string (for serialized dates)', () => {
      const validTodos = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      expect(isValidTodos(validTodos)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when no data in storage', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('todos');
    });

    it('should load and parse valid todos from storage', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(mockTodos));

      const result = loadTodos();

      expect(result).toEqual(mockTodos);
    });

    it('should handle corrupt JSON gracefully', () => {
      sessionStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid data structure gracefully', () => {
      const invalidData = [{ invalid: 'structure' }];
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid todos data in sessionStorage, clearing and using empty array'
      );

      consoleSpy.mockRestore();
    });

    it('should convert string dates back to Date objects', () => {
      const mockTodos = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(mockTodos));

      const result = loadTodos();

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('saveTodos', () => {
    it('should save todos to sessionStorage successfully', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('todos', JSON.stringify(mockTodos));
    });

    it('should handle QuotaExceededError gracefully', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      sessionStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage quota exceeded – your latest changes may not be saved.');
      expect(consoleSpy).toHaveBeenCalledWith(
        'SessionStorage quota exceeded, continuing with in-memory state'
      );

      consoleSpy.mockRestore();
    });

    it('should handle other storage errors gracefully', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      const genericError = new Error('Some other error');
      sessionStorageMock.setItem.mockImplementation(() => {
        throw genericError;
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save todos to storage.');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save todos to sessionStorage:',
        genericError
      );

      consoleSpy.mockRestore();
    });
  });
});
