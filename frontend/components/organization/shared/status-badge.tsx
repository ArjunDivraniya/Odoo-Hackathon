"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | "PENDING";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let display = status;
  let customClass = "";

  switch (status) {
    case "ACTIVE":
      variant = "default";
      customClass = "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-0";
      display = "Active";
      break;
    case "INACTIVE":
      variant = "secondary";
      display = "Inactive";
      break;
    case "ON_LEAVE":
      variant = "outline";
      customClass = "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-0";
      display = "On Leave";
      break;
    case "TERMINATED":
      variant = "destructive";
      customClass = "bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-0";
      display = "Terminated";
      break;
    case "PENDING":
      variant = "outline";
      customClass = "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-0";
      display = "Pending";
      break;
  }

  return (
    <Badge variant={variant} className={cn(customClass, className)}>
      {display}
    </Badge>
  );
}
