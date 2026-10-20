import {
  IconCheck,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { SubmitEvent, useEffect, useState } from "react";
import { TodoItem, TodoService } from "shared-db";
import InternetStatusPill from "./components/internet-status-pill";
import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./components/ui/input-group";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "./components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { cn } from "./lib/utils";

const TITLE_LIMIT = 280;

type FilterId = "all" | "open" | "done";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
];

export default function App() {
  const isOnline = useOnlineStatus();

  const [todos, setTodos] = useState<TodoItem[] | null>(null);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(Array.isArray(data) ? data : []);
    });
    return () => unsubscribe();
  }, []);

  const items = todos ?? [];
  const openCountData = items.filter((todo) => !todo.completed);
  const doneCountData = items.filter((todo) => todo.completed);
  const openCount = items.filter((todo) => !todo.completed).length;

  const doneCount = items.length - openCount;
  const totalCount = items.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !isSaving;

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const taskTitle = title.trim();
    if (!taskTitle) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await TodoService.create(taskTitle);
      setTitle("");
    } catch (err) {
      console.error("Database error: ", err);
      setSaveError("Could not save that task. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleTask(todo: TodoItem) {
    if (!todo.id) return;
    setBusyId(todo.id);
    try {
      await TodoService.toggleComplete(todo.id, todo.completed);
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  }

  async function removeTask(todo: TodoItem) {
    if (!todo.id) return;
    setBusyId(todo.id);

    try {
      await TodoService.delete(todo.id);
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  }

  async function clearCompleted() {
    const ids = items.flatMap((todo) =>
      todo.completed && todo.id ? [todo.id] : [],
    );
    if (ids.length === 0) return;
    setClearing(true);

    try {
      await Promise.all(ids.map((id) => TodoService.delete(id)));
      setConfirmClear(false);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  }

  const hint =
    saveError ??
    (isOnline
      ? "Stored on this device, then synced."
      : "Offline. This stays on this device until you reconnect.");

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <h1 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-foreground text-background"
            >
              <IconCheck className="size-4" stroke={2.5} />
            </span>{" "}
            Tasks
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <InternetStatusPill />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-6 pb-24 sm:px-6 sm:pt-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label htmlFor="task-title" className="text-sm font-medium">
            New task
          </label>
          <div className="flex gap-2">
            <Input
              id="task-title"
              name="taskTitle"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") event.currentTarget.blur();
              }}
              placeholder="What needs to be done?"
              autoFocus
              autoComplete="off"
              maxLength={TITLE_LIMIT}
              disabled={isSaving}
              aria-invalid={saveError ? true : undefined}
              aria-describedby="task-hint"
              className="h-9"
            />
            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit}
              className="min-w-24 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
            >
              {isSaving ? (
                <IconLoader2
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <IconPlus data-icon="inline-start" />
              )}
              {isSaving ? "Adding" : "Add"}
            </Button>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p
              id="task-hint"
              role={saveError ? "alert" : undefined}
              className={cn(
                "text-xs",
                saveError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {hint}
            </p>
            {title.length >= 240 && (
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {title.length}/{TITLE_LIMIT}
              </p>
            )}
          </div>
        </form>

        <section className="mt-8" aria-label="Task list">
          <Progress value={percent}>
            <ProgressLabel>
              <span className="font-medium text-foreground tabular-nums">
                {openCount}
              </span>{" "}
              Open
              <span className="px-1.5 text-border" aria-hidden>
                /
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {doneCount}
              </span>{" "}
              Done
            </ProgressLabel>
            <ProgressValue />
          </Progress>

          <Tabs defaultValue={FILTERS[0].id} className="mt-4">
            <div className="flex items-center justify-between gap-x-8">
              <TabsList className="w-full">
                <TabsTrigger value={FILTERS[0].id} className="text-xs">
                  {FILTERS[0].label}{" "}
                  <span
                    className={cn(
                      "ml-1 tabular-nums",
                      false
                        ? "text-muted-foreground"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {totalCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value={FILTERS[1].id} className="text-xs">
                  {FILTERS[1].label}{" "}
                  <span
                    className={cn(
                      "ml-1 tabular-nums",
                      false
                        ? "text-muted-foreground"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {openCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value={FILTERS[2].id} className="text-xs">
                  {FILTERS[2].label}{" "}
                  <span
                    className={cn(
                      "ml-1 tabular-nums",
                      false
                        ? "text-muted-foreground"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {doneCount}
                  </span>
                </TabsTrigger>
              </TabsList>
              <InputGroup className="w-full">
                <InputGroupInput placeholder="Search..." />
                <InputGroupAddon>
                  <IconSearch />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] leading-4 font-medium text-muted-foreground sm:inline">
                    /
                  </kbd>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <TabsContent value={FILTERS[0].id}>
              {items.map((todo, index) => (
                <TaskRow
                  key={todo.id ?? `${todo.title}-${index}`}
                  todo={todo}
                  onToggle={toggleTask}
                  onDelete={removeTask}
                />
              ))}
            </TabsContent>
            <TabsContent value={FILTERS[1].id}>
              {openCountData.map((todo, index) => (
                <TaskRow
                  key={todo.id ?? `${todo.title}-${index}`}
                  todo={todo}
                  onToggle={toggleTask}
                  onDelete={removeTask}
                />
              ))}
            </TabsContent>
            <TabsContent value={FILTERS[2].id}>
              {doneCountData.map((todo, index) => (
                <TaskRow
                  key={todo.id ?? `${todo.title}-${index}`}
                  todo={todo}
                  onToggle={toggleTask}
                  onDelete={removeTask}
                />
              ))}
            </TabsContent>
          </Tabs>

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border px-3 py-2">
              <p className="text-xs text-muted-foreground tabular-nums">
                summary
              </p>
              {doneCount > 0 &&
                (confirmClear ? (
                  <div className="flex items-center gap-1">
                    <span className="mr-1 text-xs text-muted-foreground">
                      Remove {doneCount} completed{" "}
                      {doneCount === 1 ? "task" : "tasks"}?
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmClear(false)}
                      disabled={clearing}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={clearCompleted}
                      disabled={clearing || busyId !== null}
                    >
                      {clearing ? "Removing" : "Remove"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setConfirmClear(true)}
                    disabled={clearing || busyId !== null}
                  >
                    Clear completed
                  </Button>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TaskRow({
  todo,
  onToggle,
  onDelete,
}: Readonly<{
  todo: TodoItem;
  onToggle: (todo: TodoItem) => void;
  onDelete: (todo: TodoItem) => void;
}>) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 px-2 py-1.5 transition-colors hover:bg-muted/50",
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => {
          onToggle(todo);
        }}
      />
      <span
        className={cn(
          "min-w-0 flex-1 py-1 text-sm leading-5 wrap-break-word",
          todo.completed
            ? "text-muted-foreground line-through"
            : "font-medium text-foreground",
        )}
      >
        {todo.title}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!todo.id}
        aria-label={`Delete “${todo.title}”`}
        onClick={() => onDelete(todo)}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <IconTrash />
      </Button>
    </li>
  );
}
