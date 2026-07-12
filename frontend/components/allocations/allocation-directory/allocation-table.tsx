"use client";

import { useState } from "react";
import { useAllocations } from "@/hooks/use-allocations";
import { Allocation } from "@/types/allocation";
import { DataTable, ColumnDef } from "@/components/organization/shared/data-table";
import { Pagination } from "@/components/organization/shared/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { format, isPast, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, ArrowRightLeft, Undo2, CalendarClock, Download } from "lucide-react";
import { AllocationToolbar } from "./allocation-toolbar";
import { AllocationStatusBadge } from "./allocation-status-badge";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function AllocationTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const limit = 15;

  const { data, isLoading, isError, refetch } = useAllocations({ 
    page, 
    limit, 
    search, 
    status: statusFilter !== "ALL" ? statusFilter : undefined 
  });

  if (isError) {
    return <ErrorState title="Failed to load allocations" onRetry={() => refetch()} />;
  }

  const columns: ColumnDef<Allocation>[] = [
    {
      header: "Asset",
      accessorKey: "asset",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-primary hover:underline cursor-pointer">
            <Link href={`/assets/${item.assetId}`}>{item.asset?.name || "Unknown Asset"}</Link>
          </span>
          <span className="font-mono text-xs text-muted-foreground">{item.asset?.tag || "-"}</span>
        </div>
      )
    },
    {
      header: "Employee",
      accessorKey: "employee",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : "Unknown"}</span>
          <span className="text-xs text-muted-foreground">{item.department?.name || "-"}</span>
        </div>
      )
    },
    {
      header: "Allocated",
      accessorKey: "allocatedDate",
      cell: (item) => <span className="text-sm">{item.allocatedDate ? format(new Date(item.allocatedDate), "MMM dd, yyyy") : "-"}</span>
    },
    {
      header: "Expected Return",
      accessorKey: "expectedReturnDate",
      cell: (item) => {
        if (!item.expectedReturnDate) return <span className="text-muted-foreground">-</span>;
        
        const isOverdue = item.status === "ACTIVE" && isPast(parseISO(item.expectedReturnDate));
        return (
          <span className={`text-sm ${isOverdue ? "text-destructive font-bold" : ""}`}>
            {format(new Date(item.expectedReturnDate), "MMM dd, yyyy")}
          </span>
        );
      }
    },
    {
      header: "Condition",
      accessorKey: "asset",
      cell: (item) => <Badge variant="outline" className="text-[10px] uppercase">{item.asset?.condition || "UNKNOWN"}</Badge>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <AllocationStatusBadge status={item.status} />
    },
    {
      header: "",
      className: "w-[60px]",
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/allocations/${item.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            
            {item.status === "ACTIVE" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Asset
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Undo2 className="mr-2 h-4 w-4" /> Return Asset
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarClock className="mr-2 h-4 w-4" /> Extend Return Date
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" /> Download Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <AllocationToolbar 
        onSearch={setSearch} 
        statusFilter={statusFilter} 
        onStatusFilterChange={setStatusFilter} 
      />
      
      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        emptyMessage="No allocations found matching your filters."
      />
      
      {data?.meta && (
        <Pagination 
          currentPage={data.meta.page} 
          totalPages={data.meta.totalPages} 
          onPageChange={setPage} 
        />
      )}
    </div>
  );
}
