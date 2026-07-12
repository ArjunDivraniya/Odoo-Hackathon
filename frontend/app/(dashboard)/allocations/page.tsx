"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { AllocationTable } from "@/components/allocations/allocation-directory/allocation-table";
import { Package, RefreshCw, AlertCircle, CalendarX } from "lucide-react";

export default function AllocationsPage() {
  // In a real implementation, you'd fetch this summary via a hook like useAllocationDashboardSummary()
  // We'll mock the KPI loading state for demonstration
  const isLoading = false;
  
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Allocations & Transfers</h2>
        <div className="flex items-center space-x-2">
          {/* Quick Actions will go here */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Allocations"
          value={124}
          icon={<Package className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Transfers"
          value={12}
          icon={<RefreshCw className="h-4 w-4 text-amber-500" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Returns"
          value={5}
          icon={<AlertCircle className="h-4 w-4 text-blue-500" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Overdue Returns"
          value={3}
          icon={<CalendarX className="h-4 w-4 text-rose-500" />}
          isLoading={isLoading}
          trend="-2 from last week"
        />
      </div>

      <div className="mt-8">
        <AllocationTable />
      </div>
    </div>
  );
}
