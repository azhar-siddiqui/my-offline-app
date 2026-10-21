import { IconCheck } from "@tabler/icons-react";
import InternetStatusPill from "../internet-status-pill";
import { ModeToggle } from "../mode-toggle";

export default function Header() {
  return (
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
  );
}
