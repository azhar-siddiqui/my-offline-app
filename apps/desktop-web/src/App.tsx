import { useEffect, useState } from "react";
import { TodoItem, TodoService } from "shared-db";

function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  // Automatically listen to local DB changes (Online & Offline)
  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(data);
    });
    return () => unsubscribe(); // Clean up listener when app closes
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await TodoService.create(input);
    setInput("");
    // Notice: No manual refresh needed here anymore!
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Desktop Task Manager (Instant Offline Updates)</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a task..."
          style={{ flexGrow: 1, padding: "12px" }}
        />
        <button onClick={handleAdd} style={{ padding: "12px" }}>
          Add
        </button>
      </div>

      <div>
        {todos.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: "flex",
                padding: "12px",
                borderBottom: "1px solid #ccc",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  flexGrow: 1,
                }}
              >
                {todo.title}
              </span>
              <button
                onClick={() =>
                  TodoService.toggleComplete(todo.id!, todo.completed)
                }
              >
                {todo.completed ? "Undo" : "Complete"}
              </button>
              <button
                onClick={() => TodoService.delete(todo.id!)}
                style={{ color: "red", marginLeft: "8px" }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
