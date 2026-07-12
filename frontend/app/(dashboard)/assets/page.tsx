"use client";

import { useDashboardSummary } from "@/hooks/use-dashboard";
import { KPICard } from "@/components/dashboard/kpi-card";
import { AssetTable } from "@/components/assets/asset-directory/asset-table";
import { Package, ShieldCheck, Wrench, AlertTriangle } from "lucide-react";

export default function AssetsPage() {
  const { data: summary, isLoading } = useDashboardSummary();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Directory</h2>
        <div className="flex items-center space-x-2">
          {/* Quick Actions will go here, e.g., Register Asset */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Assets"
          value={summary?.totalAssets || 0}
          icon={<Package className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Available"
          value={summary?.availableAssets || 0}
          icon={<ShieldCheck className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Under Maintenance"
          value={summary?.maintenanceToday || 0}
          icon={<Wrench className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Critical Issues"
          value={0}
          icon={<AlertTriangle className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      <div className="mt-8">
        <AssetTable />
      </div>
    </div>
  );
}
