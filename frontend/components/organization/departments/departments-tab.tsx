"use client";

import { useState } from "react";
import { useDepartments, useDeleteDepartment } from "@/hooks/use-departments";
import { Department } from "@/types/organization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable, ColumnDef } from "@/components/organization/shared/data-table";
import { SearchBar } from "@/components/organization/shared/search-bar";
import { StatusBadge } from "@/components/organization/shared/status-badge";
import { Pagination } from "@/components/organization/shared/pagination";
import { DepartmentFormDialog } from "./department-form";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function DepartmentsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, isError, refetch } = useDepartments({ page, limit, search });
  const deleteMutation = useDeleteDepartment();
  
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isError) {
    return <ErrorState title="Failed to load departments" onRetry={() => refetch()} />;
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<Department>[] = [
    {
      header: "Code",
      accessorKey: "code",
      cell: (item) => <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{item.code}</span>
    },
    {
      header: "Department Name",
      accessorKey: "name",
      cell: (item) => <span className="font-medium">{item.name}</span>
    },
    {
      header: "Parent",
      accessorKey: "parent",
      cell: (item) => <span className="text-muted-foreground">{item.parent?.name || "-"}</span>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => <StatusBadge status={item.status} />
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: (item) => <span className="text-muted-foreground">{item.createdAt ? format(new Date(item.createdAt), "MMM dd, yyyy") : "-"}</span>
    },
    {
      header: "",
      className: "w-[80px]",
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setEditingDept(item);
              setIsFormOpen(true);
            }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Departments</CardTitle>
          <CardDescription>Manage the hierarchical structure of your organization</CardDescription>
        </div>
        <DepartmentFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
          department={editingDept}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingDept(null);
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <SearchBar placeholder="Search departments..." onSearch={setSearch} />
        </div>
        
        <DataTable 
          columns={columns} 
          data={data?.data || []} 
          isLoading={isLoading} 
          emptyMessage="No departments found. Create a new one to get started."
        />
        
        {data?.meta && (
          <Pagination 
            currentPage={data.meta.page} 
            totalPages={data.meta.totalPages} 
            onPageChange={setPage} 
          />
        )}
      </CardContent>
    </Card>
  );
}
