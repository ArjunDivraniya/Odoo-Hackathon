"use client";

import { SearchBar } from "@/components/organization/shared/search-bar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, Plus, QrCode } from "lucide-react";

interface AssetToolbarProps {
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function AssetToolbar({ onSearch, statusFilter, onStatusFilterChange }: AssetToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
      <div className="flex flex-1 items-center gap-4 w-full">
        <SearchBar 
          placeholder="Search assets by name, tag, or serial..." 
          onSearch={onSearch} 
          className="flex-1 max-w-md"
        />
        
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px] hidden md:flex">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" className="gap-2 hidden lg:flex">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="secondary" className="gap-2">
          <QrCode className="h-4 w-4" />
          Scan
        </Button>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Register Asset
        </Button>
      </div>
    </div>
  );
}
