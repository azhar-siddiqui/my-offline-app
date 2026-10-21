import { useTodos } from "@/hooks/useTodos";
import { Progress, ProgressLabel, ProgressValue } from "../ui/progress";

export default function ProgressBar() {
  const { openCount, percent, doneCount } = useTodos();
  return (
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
  );
}
