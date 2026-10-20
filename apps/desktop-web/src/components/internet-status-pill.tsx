import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "cn";
import { Badge } from "./ui/badge";

export default function InternetStatusPill() {
  const isOnline = useOnlineStatus();
  return (
    <Badge
      variant="outline"
      className="gap-2 px-3 py-3.5 font-medium transition-colors duration-300 rounded-md"
      aria-live="polite" // Tells screen readers to announce status changes
    >
      <span className="relative flex h-2 w-2">
        {/* Breathing pulse effect only when online */}
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full transition-colors duration-300",
            isOnline ? "bg-emerald-500" : "bg-destructive", // Standard shadcn destructive red for offline
          )}
        />
      </span>
      <span className="text-xs tracking-wide">
        {isOnline ? "Online" : "Offline"}
      </span>
    </Badge>
  );
}
