import { useTodos } from "@/hooks/useTodos";
import {
  IconCircleCheck,
  IconListCheck,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { cn } from "cn";
import { useEffect, useState, type ComponentType } from "react";
import { TodoItem } from "shared-db";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export type FilterId = "all" | "open" | "done";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
];

export default function TabBar() {
  const {
    totalCount,
    openCount,
    doneCount,
    todos,
    openCountData,
    doneCountData,
    isLoading,
    busyId,
    toggleTask,
    removeTask,
  } = useTodos();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      event.preventDefault();
      document.getElementById("task-search")?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const counts: Record<FilterId, number> = {
    all: totalCount,
    open: openCount,
    done: doneCount,
  };
  const panels: { id: FilterId; items: TodoItem[] }[] = [
    { id: "all", items: filterTodos(todos, query) },
    { id: "open", items: filterTodos(openCountData, query) },
    { id: "done", items: filterTodos(doneCountData, query) },
  ];

  return (
    <Tabs defaultValue="all" className="mt-4 gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-fit">
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.id}
              value={filter.id}
              className="px-2.5 text-xs sm:flex-none"
            >
              {filter.label}
              {!isLoading && (
                <span className="ml-1.5 tabular-nums text-muted-foreground/80 in-data-active:text-muted-foreground">
                  {counts[filter.id]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <InputGroup className="w-full sm:w-56">
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
          <InputGroupInput
            id="task-search"
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
          />
          {query ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Clear search"
                size="icon-xs"
                onClick={() => {
                  setQuery("");
                  document.getElementById("task-search")?.focus();
                }}
              >
                <IconX />
              </InputGroupButton>
            </InputGroupAddon>
          ) : (
            <InputGroupAddon align="inline-end" className="hidden sm:flex">
              <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] leading-4 font-medium text-muted-foreground">
                /
              </kbd>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {panels.map((panel) => (
          <TabsContent key={panel.id} value={panel.id}>
            <TaskPanel
              filter={panel.id}
              items={panel.items}
              query={query}
              isLoading={isLoading}
              busyId={busyId}
              onToggle={toggleTask}
              onDelete={removeTask}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

function filterTodos(todos: TodoItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return todos;
  return todos.filter((todo) => todo.title.toLowerCase().includes(needle));
}

function TaskPanel({
  filter,
  items,
  query,
  isLoading,
  busyId,
  onToggle,
  onDelete,
}: Readonly<{
  filter: FilterId;
  items: TodoItem[];
  query: string;
  isLoading: boolean;
  busyId: string | null;
  onToggle: (todo: TodoItem) => void;
  onDelete: (todo: TodoItem) => void;
}>) {
  if (isLoading) return <LoadingRows />;
  if (items.length === 0) return <EmptyState {...emptyCopy(filter, query)} />;

  return (
    <ul className="divide-y divide-border">
      {items.map((todo, index) => (
        <TaskRow
          key={todo.id ?? `${todo.title}-${index}`}
          todo={todo}
          busy={busyId === todo.id}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TaskRow({
  todo,
  busy,
  onToggle,
  onDelete,
}: Readonly<{
  todo: TodoItem;
  busy: boolean;
  onToggle: (todo: TodoItem) => void;
  onDelete: (todo: TodoItem) => void;
}>) {
  const inputId = `task-${todo.id ?? todo.title}`;
  const label = todo.title.trim() || "Untitled";

  return (
    <li
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 transition-colors hover:bg-muted/50",
        busy && "opacity-60",
      )}
      aria-busy={busy}
    >
      <div className="flex size-8 shrink-0 items-center justify-center">
        <Checkbox
          id={inputId}
          checked={todo.completed}
          disabled={busy || !todo.id}
          aria-label={
            todo.completed
              ? `Mark “${label}” as open`
              : `Mark “${label}” as done`
          }
          onCheckedChange={() => onToggle(todo)}
        />
      </div>
      <label
        htmlFor={inputId}
        className={cn(
          "min-w-0 flex-1 cursor-pointer py-1 text-sm leading-5 wrap-break-word",
          todo.completed
            ? "text-muted-foreground line-through"
            : "font-medium text-foreground",
          busy && "pointer-events-none",
        )}
      >
        {label}
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={busy || !todo.id}
        aria-label={`Delete “${label}”`}
        onClick={() => onDelete(todo)}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <IconTrash />
      </Button>
    </li>
  );
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

function EmptyState({
  icon: Icon,
  title,
  body,
}: Readonly<{
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}>) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-balance text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div aria-hidden className="animate-pulse divide-y divide-border">
      {[68, 46, 58].map((width) => (
        <div key={width} className="flex items-center gap-3 px-3 py-3">
          <div className="size-4 rounded-md bg-muted" />
          <div
            className="h-3 rounded bg-muted"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  );
}
