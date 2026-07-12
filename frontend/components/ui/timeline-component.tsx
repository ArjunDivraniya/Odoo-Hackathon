import { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

export interface TimelineItemProps {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  timestamp: string | Date;
  status?: "default" | "success" | "warning" | "destructive";
  isLast?: boolean;
}

export function Timeline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-0 ${className}`}>{children}</div>;
}

export function TimelineItem({
  icon,
  title,
  description,
  timestamp,
  status = "default",
  isLast = false,
}: TimelineItemProps) {
  const statusColors = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    destructive: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0 group">
      {!isLast && (
        <div className="absolute left-[19px] top-8 bottom-0 w-px bg-border group-last:hidden" />
      )}
      
      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm ${statusColors[status]}`}>
        {icon}
      </div>
      
      <div className="flex flex-col flex-1 pt-1.5 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
