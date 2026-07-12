import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

export interface TaskItemProps {
  id: string;
  title: string;
  description: string;
  metadata?: ReactNode;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
  date?: string | Date;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function TaskItem({
  id,
  title,
  description,
  metadata,
  priority,
  date,
  onApprove,
  onReject,
}: TaskItemProps) {
  
  const getPriorityBadge = (p?: string) => {
    switch(p) {
      case "HIGH":
      case "URGENT":
      case "CRITICAL":
        return <Badge variant="destructive" className="text-[10px]">High Priority</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Medium Priority</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
          {getPriorityBadge(priority)}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        
        {(metadata || date) && (
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            {metadata}
            {date && <span>Due: {format(new Date(date), "MMM d, yyyy")}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onReject && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => onReject(id)}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Reject
          </Button>
        )}
        {onApprove && (
          <Button 
            size="sm" 
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onApprove(id)}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}
