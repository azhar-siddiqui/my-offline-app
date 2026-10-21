import { useTodos } from "@/hooks/useTodos";
import { IconSearch, IconTrash } from "@tabler/icons-react";
import { cn } from "cn";
import { TodoItem } from "shared-db";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
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
    toggleTask,
    removeTask,
  } = useTodos();

  return (
    <Tabs defaultValue={FILTERS[0].id} className="mt-4">
      <div className="flex items-center justify-between gap-x-8">
        <TabsList className="w-full">
          <TabsTrigger value={FILTERS[0].id} className="text-xs">
            {FILTERS[0].label}{" "}
            <span
              className={cn(
                "ml-1 tabular-nums",
                false ? "text-muted-foreground" : "text-muted-foreground/80",
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
                false ? "text-muted-foreground" : "text-muted-foreground/80",
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
                false ? "text-muted-foreground" : "text-muted-foreground/80",
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
        {todos.map((todo, index) => (
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
