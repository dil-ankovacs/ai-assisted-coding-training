import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoProvider } from '../contexts/TodoContext';
import { ToastProvider } from '../components/Toast';
import { useTodo } from '../hooks/useTodo';
import * as sessionStorageUtils from '../utils/sessionStorage';

// Mock the sessionStorage utilities
vi.mock('../utils/sessionStorage');
const mockLoadTodos = vi.mocked(sessionStorageUtils.loadTodos);
const mockSaveTodos = vi.mocked(sessionStorageUtils.saveTodos);

// Test component that uses the TodoContext
const TestComponent = () => {
  const { todos, addTodo } = useTodo();

  return (
    <div>
      <div data-testid="todo-count">{todos.length}</div>
      <button onClick={() => addTodo('Test Todo', 'Test Description')} data-testid="add-todo">
        Add Todo
      </button>
      <div data-testid="todos">
        {todos.map(todo => (
          <div key={todo.id} data-testid={`todo-${todo.id}`}>
            {todo.title}
          </div>
        ))}
      </div>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <TodoProvider>{children}</TodoProvider>
  </ToastProvider>
);

describe('TodoContext integration with sessionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hydrate todos from sessionStorage on initialization', () => {
    const mockTodos = [
      {
        id: '1',
        title: 'Existing Todo',
        description: 'From storage',
        completed: false,
        createdAt: new Date(),
      },
    ];

    mockLoadTodos.mockReturnValue(mockTodos);
    mockSaveTodos.mockReturnValue({ success: true });

    render(<TestComponent />, { wrapper: TestWrapper });

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(screen.getByTestId('todo-1')).toHaveTextContent('Existing Todo');
    expect(mockLoadTodos).toHaveBeenCalledOnce();
  });

  it('should save todos to sessionStorage when adding a new todo', async () => {
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue({ success: true });

    render(<TestComponent />, { wrapper: TestWrapper });

    const addButton = screen.getByTestId('add-todo');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    });

    // Should be called twice: once for initial empty array, once for the added todo
    expect(mockSaveTodos).toHaveBeenCalledTimes(2);
    expect(mockSaveTodos).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
        }),
      ])
    );
  });

  it('should show toast when storage save fails', async () => {
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue({
      success: false,
      error: 'Storage quota exceeded – your latest changes may not be saved.',
    });

    render(<TestComponent />, { wrapper: TestWrapper });

    const addButton = screen.getByTestId('add-todo');
    fireEvent.click(addButton);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    const alerts = screen.getAllByRole('alert');
    expect(alerts[0]).toHaveTextContent(
      'Storage quota exceeded – your latest changes may not be saved.'
    );
  });

  it('should start with empty array when loadTodos returns empty', () => {
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue({ success: true });

    render(<TestComponent />, { wrapper: TestWrapper });

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockLoadTodos).toHaveBeenCalledOnce();
  });
});
