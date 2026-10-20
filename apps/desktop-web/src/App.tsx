import { useActionState, useEffect, useState } from "react";
import { TodoItem, TodoService } from "shared-db";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export default function App() {
  const [todos, setTodos] = useState<TodoItem[] | null>(null);

  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(Array.isArray(data) ? data : data ? [data] : []);
    });
    return () => unsubscribe();
  }, []);

  const [error, submitAction, isPending] = useActionState(
    async (_previousState: any, formData: FormData) => {
      const taskTitle = formData.get("taskTitle") as string;
      if (!taskTitle?.trim()) return null;

      try {
        await TodoService.create(taskTitle.trim());
        return null;
      } catch (err) {
        console.error("Database error: ", err);
        return "Failed to save task.";
      }
    },
    null,
  );

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm font-sans">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
        Desktop Task Manager
      </h1>

      <form action={submitAction} className="flex gap-2 mb-6">
        <Input
          name="taskTitle"
          type="text"
          placeholder="What needs to be done? (Works offline)"
          disabled={isPending}
        />
        {/* Rendered shadcn button styled beautifully via Tailwind */}
        <Button type="submit" disabled={isPending} variant="default">
          {isPending ? "Adding..." : "Add Task"}
        </Button>
      </form>

      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

      <div className="space-y-2">
        {todos === null ? (
          <p className="text-slate-400 text-sm italic text-center py-4">
            Synchronizing local cache...
          </p>
        ) : todos.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No tasks found. Add your first item above!
          </p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-2xs transition-all hover:border-slate-300"
            >
              <span
                className={`text-sm font-medium ${
                  todo.completed
                    ? "line-through text-slate-400"
                    : "text-slate-700"
                }`}
              >
                {todo.title}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    TodoService.toggleComplete(todo.id!, todo.completed)
                  }
                  variant="outline"
                  size="sm"
                >
                  {todo.completed ? "Undo" : "Complete"}
                </Button>
                <Button
                  onClick={() => TodoService.delete(todo.id!)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
