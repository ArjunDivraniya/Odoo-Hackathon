"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AllocationStatus } from "@/types/allocation";

interface AllocationStatusBadgeProps {
  status: AllocationStatus;
  className?: string;
}

export function AllocationStatusBadge({ status, className }: AllocationStatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let display = status;
  let customClass = "";

  switch (status) {
    case "ACTIVE":
      variant = "default";
      customClass = "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-0";
      display = "Active";
      break;
    case "RETURNED":
      variant = "secondary";
      display = "Returned";
      break;
    case "OVERDUE":
      variant = "destructive";
      customClass = "bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-0 font-bold animate-pulse";
      display = "Overdue";
      break;
    case "TRANSFERRING":
      variant = "outline";
      customClass = "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-0";
      display = "Transferring";
      break;
    case "CANCELLED":
      variant = "outline";
      display = "Cancelled";
      break;
  }

  return (
    <Badge variant={variant} className={cn(customClass, className)}>
      {display}
    </Badge>
  );
}
