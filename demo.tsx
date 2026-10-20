import {
  IconCheck,
  IconCircleCheck,
  IconListCheck,
  IconLoader2,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSun,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  SubmitEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { TodoItem, TodoService } from "shared-db";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { cn } from "./lib/utils";

const THEME_KEY = "tasks-theme";
const TITLE_LIMIT = 280;
const UNDO_MS = 6000;

type FilterId = "all" | "open" | "done";
type Theme = "light" | "dark";
type DeletedTask = { title: string; completed: boolean };

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
];

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private mode and blocked storage fall through to the system theme.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function visibleTodos(todos: TodoItem[], filter: FilterId, query: string) {
  const needle = query.trim().toLowerCase();
  return [...todos]
    .reverse()
    .filter((todo) => {
      if (filter === "open" && todo.completed) return false;
      if (filter === "done" && !todo.completed) return false;
      if (needle && !todo.title.toLowerCase().includes(needle)) return false;
      return true;
    })
    .sort((a, b) => Number(a.completed) - Number(b.completed));
}

function summarize(
  ready: boolean,
  filter: FilterId,
  query: string,
  visibleCount: number,
  openCount: number,
  doneCount: number,
  totalCount: number,
) {
  if (!ready) return "Loading your tasks";
  if (query.trim()) {
    return visibleCount === 1 ? "1 match" : `${visibleCount} matches`;
  }
  if (filter === "open") {
    return openCount === 1 ? "1 open task" : `${openCount} open tasks`;
  }
  if (filter === "done") {
    return doneCount === 1
      ? "1 completed task"
      : `${doneCount} completed tasks`;
  }
  return totalCount === 1 ? "1 task" : `${totalCount} tasks`;
}

function emptyCopy(filter: FilterId, query: string) {
  const needle = query.trim();
  if (needle) {
    return {
      icon: IconSearch,
      title: "No matching tasks",
      body: `Nothing matches “${needle}”.`,
    };
  }
  if (filter === "open") {
    return {
      icon: IconCircleCheck,
      title: "You're caught up",
      body: "Open tasks will show up here.",
    };
  }
  if (filter === "done") {
    return {
      icon: IconCircleCheck,
      title: "No completed tasks",
      body: "Tasks you finish will land here.",
    };
  }
  return {
    icon: IconListCheck,
    title: "No tasks yet",
    body: "Add the first one above. It stays available offline.",
  };
}

export default function App() {
  const [todos, setTodos] = useState<TodoItem[] | null>(null);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [undo, setUndo] = useState<DeletedTask | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);

  const savingRef = useRef(false);
  const busyRef = useRef<string | null>(null);
  const clearingRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = TodoService.subscribeToTodos((data) => {
      setTodos(Array.isArray(data) ? data : []);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") return;
      } catch {
        // If storage can't be read, follow the system theme.
      }
      setTheme(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (todos !== null) return;
    const timer = window.setTimeout(() => setSlowLoad(true), 4000);
    return () => window.clearTimeout(timer);
  }, [todos]);

  useEffect(() => {
    if (!todos) {
      document.title = "Tasks";
      return;
    }
    const open = todos.filter((todo) => !todo.completed).length;
    document.title = open > 0 ? `Tasks (${open})` : "Tasks";
  }, [todos]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        titleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const ready = todos !== null;
  const items = todos ?? [];
  const openCount = items.filter((todo) => !todo.completed).length;
  const doneCount = items.length - openCount;
  const totalCount = items.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const visible = useMemo(
    () => visibleTodos(todos ?? [], filter, query),
    [todos, filter, query],
  );
  const summary = summarize(
    ready,
    filter,
    query,
    visible.length,
    openCount,
    doneCount,
    totalCount,
  );
  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !isSaving;

  useEffect(() => {
    if (doneCount === 0) setConfirmClear(false);
  }, [doneCount]);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // The theme still applies for this session if storage is blocked.
      }
      return next;
    });
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const taskTitle = title.trim();
    if (!taskTitle || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      await TodoService.create(taskTitle);
      setTitle("");
      titleRef.current?.focus();
    } catch (err) {
      console.error("Database error: ", err);
      setSaveError("Could not save that task. Try again.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  async function toggleTask(todo: TodoItem) {
    if (!todo.id || busyRef.current || clearingRef.current) return;
    busyRef.current = todo.id;
    setBusyId(todo.id);
    setActionError(null);
    try {
      await TodoService.toggleComplete(todo.id, todo.completed);
    } catch (err) {
      console.error(err);
      setActionError("Could not update that task.");
    } finally {
      busyRef.current = null;
      setBusyId(null);
    }
  }

  async function removeTask(todo: TodoItem) {
    if (!todo.id || busyRef.current || clearingRef.current) return;
    busyRef.current = todo.id;
    setBusyId(todo.id);
    setActionError(null);
    try {
      await TodoService.delete(todo.id);
      setUndo({ title: todo.title, completed: todo.completed });
    } catch (err) {
      console.error(err);
      setActionError("Could not delete that task.");
    } finally {
      busyRef.current = null;
      setBusyId(null);
    }
  }

  async function restoreTask() {
    if (!undo || restoring) return;
    const snapshot = undo;
    setRestoring(true);
    setUndo(null);
    setActionError(null);
    try {
      const id = await TodoService.create(snapshot.title);
      if (snapshot.completed) await TodoService.toggleComplete(id, false);
    } catch (err) {
      console.error(err);
      setUndo(snapshot);
      setActionError("Could not restore that task.");
    } finally {
      setRestoring(false);
    }
  }

  async function clearCompleted() {
    const ids = items.flatMap((todo) =>
      todo.completed && todo.id ? [todo.id] : [],
    );
    if (ids.length === 0 || clearingRef.current || busyRef.current) return;
    clearingRef.current = true;
    setClearing(true);
    setActionError(null);
    try {
      await Promise.all(ids.map((id) => TodoService.delete(id)));
      setConfirmClear(false);
    } catch (err) {
      console.error(err);
      setActionError("Could not clear completed tasks.");
    } finally {
      clearingRef.current = false;
      setClearing(false);
    }
  }

  const hint =
    saveError ??
    (online
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
            <StatusPill online={online} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
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
              ref={titleRef}
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

        <section className="mt-8" aria-busy={!ready} aria-label="Task list">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {ready ? (
                <>
                  <span className="font-medium text-foreground tabular-nums">
                    {openCount}
                  </span>{" "}
                  open
                  <span className="px-1.5 text-border" aria-hidden>
                    /
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {doneCount}
                  </span>{" "}
                  done
                </>
              ) : (
                "Loading tasks"
              )}
            </p>
            {ready && totalCount > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {percent}%
              </p>
            )}
          </div>

          {ready && totalCount > 0 && (
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Completed tasks"
            >
              <div
                className="h-full rounded-full bg-foreground motion-safe:transition-[width] motion-safe:duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex w-fit rounded-lg bg-muted p-0.5"
              role="group"
              aria-label="Filter tasks"
            >
              {FILTERS.map((item) => {
                const selected = filter === item.id;
                const count =
                  item.id === "open"
                    ? openCount
                    : item.id === "done"
                      ? doneCount
                      : totalCount;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors",
                      selected
                        ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {ready && (
                      <span
                        className={cn(
                          "ml-1.5 tabular-nums",
                          selected
                            ? "text-muted-foreground"
                            : "text-muted-foreground/80",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-56">
              <IconSearch
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  if (query) {
                    event.preventDefault();
                    setQuery("");
                    return;
                  }
                  event.currentTarget.blur();
                }}
                placeholder="Search"
                aria-label="Search tasks"
                autoComplete="off"
                className="h-8 pr-8 pl-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] leading-4 font-medium text-muted-foreground sm:inline">
                  /
                </kbd>
              )}
            </div>
          </div>

          {actionError && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {actionError}
            </p>
          )}

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            {!ready ? (
              <LoadingRows />
            ) : visible.length === 0 ? (
              <EmptyState {...emptyCopy(filter, query)} />
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((todo, index) => (
                  <TaskRow
                    key={todo.id ?? `${todo.title}-${index}`}
                    todo={todo}
                    busy={busyId === todo.id || clearing}
                    onToggle={toggleTask}
                    onDelete={removeTask}
                  />
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border px-3 py-2">
              <p className="text-xs text-muted-foreground tabular-nums">
                {summary}
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

          {!ready && slowLoad && (
            <p className="mt-3 text-xs text-muted-foreground">
              Still opening the local cache. You can add a task in the meantime.
            </p>
          )}
        </section>
      </main>

      {undo && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div
            role="status"
            className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg"
          >
            <p className="min-w-0 flex-1 truncate text-sm" title={undo.title}>
              Deleted “{undo.title}”
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={restoreTask}
              disabled={restoring}
            >
              {restoring ? "Restoring" : "Undo"}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Dismiss"
              onClick={() => setUndo(null)}
            >
              <IconX />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ online }: { online: boolean }) {
  return (
    <span
      className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2 text-xs font-medium text-muted-foreground"
      title={
        online
          ? "Changes sync while you are online"
          : "Changes stay on this device until you are back online"
      }
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          online ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      <span aria-live="polite">{online ? "Online" : "Offline"}</span>
    </span>
  );
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const dark = theme === "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </Button>
  );
}

function TaskRow({
  todo,
  busy,
  onToggle,
  onDelete,
}: {
  todo: TodoItem;
  busy: boolean;
  onToggle: (todo: TodoItem) => void;
  onDelete: (todo: TodoItem) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 transition-colors hover:bg-muted/50",
        busy && "opacity-60",
      )}
      aria-busy={busy}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={
          todo.completed
            ? `Mark “${todo.title}” as open`
            : `Mark “${todo.title}” as done`
        }
        disabled={busy || !todo.id}
        onClick={() => onToggle(todo)}
        className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none"
      >
        <span
          className={cn(
            "flex size-[18px] items-center justify-center rounded-full border transition-colors",
            todo.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background",
          )}
        >
          {busy ? (
            <IconLoader2 className="size-3 animate-spin" />
          ) : (
            todo.completed && <IconCheck className="size-3" stroke={2.5} />
          )}
        </span>
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 py-1 text-sm leading-5 break-words",
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
        disabled={busy || !todo.id}
        aria-label={`Delete “${todo.title}”`}
        onClick={() => onDelete(todo)}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <IconTrash />
      </Button>
    </li>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div aria-hidden className="animate-pulse divide-y divide-border">
      {[68, 46, 58, 40].map((width) => (
        <div key={width} className="flex items-center gap-3 px-3 py-3">
          <div className="size-[18px] rounded-full bg-muted" />
          <div
            className="h-3 rounded bg-muted"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  );
}
