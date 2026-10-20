import { useActionState, useEffect, useState } from "react";
import { TodoItem, TodoService } from "shared-db";

export default function App() {
  // 1. React 19 Pattern: Initialize state as null to represent the initial synchronization state.
  const [todos, setTodos] = useState<TodoItem[] | null>(null);

  // Still listening to the live offline/online Firestore snapshot queue
  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(Array.isArray(data) ? data : data ? [data] : []);
    });
    return () => unsubscribe();
  }, []);

  // 2. React 19 Action Definition: Native form action implementation.
  // The action automatically receives form data, managing offline write transitions seamlessly.
  const [error, submitAction, isPending] = useActionState(
    async (_previousState: any, formData: FormData) => {
      const taskTitle = formData.get("taskTitle") as string;
      if (!taskTitle?.trim()) return null;

      try {
        await TodoService.create(taskTitle.trim());
        return null; // Success state
      } catch (err) {
        console.error("Failed to commit task offline: ", err);
        return "Failed to save task.";
      }
    },
    null,
  );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1>Desktop Task Manager (React 19.3.0 Client)</h1>

      {/* 3. React 19 Action Form: Uses native form actions instead of manual handlers */}
      <form
        action={submitAction}
        style={{ display: "flex", gap: "8px", marginBottom: "24px" }}
      >
        <input
          name="taskTitle"
          type="text"
          placeholder="What needs to be done? (Works offline)"
          disabled={isPending}
          style={{
            flexGrow: 1,
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "12px 24px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {isPending ? "Adding..." : "Add Task"}
        </button>
      </form>

      {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

      <div>
        {/* 4. Strict State Branching: Resolves the microsecond micro-flash UI bug */}
        {todos === null ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            Synchronizing local cache...
          </p>
        ) : todos.length === 0 ? (
          <p>No tasks found. Add your first item above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: "flex",
                padding: "16px",
                borderBottom: "1px solid #eee",
                alignItems: "center",
                backgroundColor: "#fff",
              }}
            >
              <span
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#aaa" : "#333",
                  flexGrow: 1,
                  fontSize: "16px",
                }}
              >
                {todo.title}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() =>
                    TodoService.toggleComplete(todo.id!, todo.completed)
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  {todo.completed ? "Undo" : "Complete"}
                </button>
                <button
                  onClick={() => TodoService.delete(todo.id!)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#ffebee",
                    color: "#c62828",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
