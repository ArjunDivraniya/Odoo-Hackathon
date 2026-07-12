import { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface NotificationItemProps {
  id: string;
  icon?: ReactNode;
  title: string;
  message: string;
  timestamp: string | Date;
  isRead?: boolean;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({
  id,
  icon,
  title,
  message,
  timestamp,
  isRead = false,
  onMarkRead,
}: NotificationItemProps) {
  return (
    <div className={`flex gap-4 p-4 rounded-lg border transition-colors ${isRead ? 'bg-background border-transparent' : 'bg-muted/30 border-border/50 shadow-sm'}`}>
      {icon && (
        <div className="shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <p className={`text-sm truncate ${isRead ? 'font-medium text-foreground/80' : 'font-semibold text-foreground'}`}>
            {title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
        <p className={`text-sm line-clamp-2 ${isRead ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
          {message}
        </p>
      </div>

      {!isRead && onMarkRead && (
        <div className="shrink-0 self-center ml-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-background"
            onClick={() => onMarkRead(id)}
            title="Mark as read"
          >
            <Check className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}
