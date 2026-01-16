import { cn } from "@/lib/utils";
import { Clock, Wrench, CheckCircle2 } from "lucide-react";

type Status = "pending" | "in_progress" | "completed";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status as Status;

  const config = {
    pending: {
      label: "Pending",
      color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      icon: Clock,
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      icon: Wrench,
    },
    completed: {
      label: "Completed",
      color: "bg-green-500/10 text-green-500 border-green-500/20",
      icon: CheckCircle2,
    },
  };

  const current = config[normalizedStatus] || config.pending;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-sm border text-xs font-bold uppercase tracking-wider w-fit",
        current.color,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </div>
  );
}
