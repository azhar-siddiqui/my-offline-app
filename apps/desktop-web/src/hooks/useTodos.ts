import { useEffect, useState, useTransition } from "react";
import { TodoItem, TodoService } from "shared-db";

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[] | null>(null);

  // React 19 transition hook to handle async loading states smoothly
  const [isPending, startTransition] = useTransition();

  // Track the active task ID being updated to show fine-grained loading spinners
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Subscribe to raw data feed
  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(Array.isArray(data) ? data : []);
    });
    return () => unsubscribe();
  }, []);

  // Memoized values computed directly from state
  const items = todos ?? [];
  const openCountData = items.filter((todo) => !todo.completed);
  const doneCountData = items.filter((todo) => todo.completed);
  const totalCount = items.length;
  const openCount = openCountData.length;
  const doneCount = totalCount - openCount;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Toggle complete state using React 19 Transitions
  function toggleTask(todo: TodoItem) {
    if (!todo.id) return;
    setBusyId(todo.id);

    startTransition(async () => {
      try {
        await TodoService.toggleComplete(todo.id!, todo.completed);
      } catch (err) {
        console.error(err);
      } finally {
        setBusyId(null);
      }
    });
  }

  async function editTask(todo: TodoItem, title: string) {
    if (!todo.id) return;
    const next = title.trim();
    if (!next || next === todo.title.trim()) return;

    setBusyId(todo.id);
    try {
      await TodoService.updateTitle(todo.id, next);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  // Remove a task using React 19 Transitions
  function removeTask(todo: TodoItem) {
    if (!todo.id) return;
    setBusyId(todo.id);

    startTransition(async () => {
      try {
        await TodoService.delete(todo.id!);
      } catch (err) {
        console.error(err);
      } finally {
        setBusyId(null);
      }
    });
  }

  // Clear all completed tasks using React 19 Transitions
  function clearCompleted() {
    const ids = items.flatMap((todo) =>
      todo.completed && todo.id ? [todo.id] : [],
    );
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => TodoService.delete(id)));
        setConfirmClear(false);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return {
    // Data State
    todos: items,
    isLoading: todos === null, // Initial fetch loading state

    // Extracted Analytics
    openCountData,
    doneCountData,
    openCount,
    doneCount,
    totalCount,
    percent,

    // Status Toggles
    busyId,
    isClearing: isPending && !busyId, // True if transition is running, but no single task is busy
    confirmClear,
    setConfirmClear,

    // Async Handlers
    toggleTask,
    editTask,
    removeTask,
    clearCompleted,
  };
}
