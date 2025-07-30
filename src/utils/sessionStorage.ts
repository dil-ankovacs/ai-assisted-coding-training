import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates if the provided data is a valid Todo array
 */
export function isValidTodos(data: unknown): data is Todo[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      typeof item.completed === 'boolean' &&
      (item.createdAt instanceof Date || typeof item.createdAt === 'string')
    );
  });
}

/**
 * Loads todos from sessionStorage with validation and error handling
 */
export function loadTodos(): Todo[] {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data in sessionStorage, clearing and using empty array');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects if needed
    return parsed.map(todo => ({
      ...todo,
      createdAt: typeof todo.createdAt === 'string' ? new Date(todo.createdAt) : todo.createdAt,
    }));
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    // Clear corrupted data
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors when trying to clear
    }
    return [];
  }
}

/**
 * Saves todos to sessionStorage with error handling
 * @param todos - Array of todos to save
 * @returns Promise that resolves to success boolean and optional error message
 */
export function saveTodos(todos: Todo[]): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('SessionStorage quota exceeded, continuing with in-memory state');
      return {
        success: false,
        error: 'Storage quota exceeded – your latest changes may not be saved.',
      };
    }

    console.warn('Failed to save todos to sessionStorage:', error);
    return {
      success: false,
      error: 'Failed to save todos to storage.',
    };
  }
}
