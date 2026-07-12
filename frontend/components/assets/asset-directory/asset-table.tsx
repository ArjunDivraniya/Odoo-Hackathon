"use client";

import { useState } from "react";
import { useAssets, useDeleteAsset } from "@/hooks/use-assets";
import { Asset } from "@/types/asset";
import { DataTable, ColumnDef } from "@/components/organization/shared/data-table";
import { Pagination } from "@/components/organization/shared/pagination";
import { StatusBadge } from "@/components/organization/shared/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { AssetToolbar } from "./asset-toolbar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function AssetTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const limit = 15;

  const { data, isLoading, isError, refetch } = useAssets({ 
    page, 
    limit, 
    search, 
    status: statusFilter !== "ALL" ? statusFilter : undefined 
  });
  
  const deleteMutation = useDeleteAsset();

  if (isError) {
    return <ErrorState title="Failed to load assets" onRetry={() => refetch()} />;
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<Asset>[] = [
    {
      header: "Asset Tag",
      accessorKey: "tag",
      cell: (item) => <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{item.tag}</span>
    },
    {
      header: "Asset Name",
      accessorKey: "name",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-primary hover:underline cursor-pointer">
            <Link href={`/assets/${item.id}`}>{item.name}</Link>
          </span>
          <span className="text-xs text-muted-foreground">{item.category?.name || "Uncategorized"}</span>
        </div>
      )
    },
    {
      header: "Assignment",
      accessorKey: "assignedUser",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-sm">{item.assignedUser ? `${item.assignedUser.firstName} ${item.assignedUser.lastName}` : "Unassigned"}</span>
          <span className="text-xs text-muted-foreground">{item.department?.name || "-"}</span>
        </div>
      )
    },
    {
      header: "Condition",
      accessorKey: "condition",
      cell: (item) => <Badge variant="outline" className="text-[10px] uppercase">{item.condition}</Badge>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <StatusBadge status={item.status as any} />
    },
    {
      header: "Updated",
      accessorKey: "updatedAt",
      cell: (item) => <span className="text-xs text-muted-foreground">{item.updatedAt ? format(new Date(item.updatedAt), "MMM dd, yyyy") : "-"}</span>
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
              <Link href={`/assets/${item.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" /> Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShieldAlert className="mr-2 h-4 w-4" /> Log Maintenance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <AssetToolbar 
        onSearch={setSearch} 
        statusFilter={statusFilter} 
        onStatusFilterChange={setStatusFilter} 
      />
      
      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        emptyMessage="No assets found matching your filters."
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
