import { useTodos } from "@/hooks/useTodos";
import { Button } from "../ui/button";

export default function TaskFooter() {
  const {
    doneCount,
    confirmClear,
    isClearing,
    setConfirmClear,
    clearCompleted,
    busyId,
    totalCount,
  } = useTodos();

  function summarize() {
    const remainingCount = totalCount - doneCount;

    if (totalCount === 0) return "No tasks";

    const taskText = remainingCount === 1 ? "task" : "tasks";
    return `${remainingCount} ${taskText} left (out of ${totalCount})`;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2">
        <p className="text-xs text-muted-foreground tabular-nums">
          {summarize()}
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
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={clearCompleted}
                disabled={isClearing || busyId !== null}
              >
                {isClearing ? "Removing" : "Remove"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={() => setConfirmClear(true)}
              disabled={isClearing || busyId !== null}
            >
              Clear completed
            </Button>
          ))}
      </div>
    </div>
  );
}
