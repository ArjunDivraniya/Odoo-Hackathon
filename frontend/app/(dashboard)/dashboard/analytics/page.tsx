import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart as ChartIcon } from "lucide-react";

// Dynamically import heavy chart components to optimize initial bundle size
const AssetStatusChart = dynamic(() => import("@/components/dashboard/analytics/asset-status-chart").then(mod => mod.AssetStatusChart), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const DepartmentUtilizationChart = dynamic(() => import("@/components/dashboard/analytics/department-utilization-chart").then(mod => mod.DepartmentUtilizationChart), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const MaintenanceTrendChart = dynamic(() => import("@/components/dashboard/analytics/maintenance-trend-chart").then(mod => mod.MaintenanceTrendChart), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const BookingTrendChart = dynamic(() => import("@/components/dashboard/analytics/booking-trend-chart").then(mod => mod.BookingTrendChart), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const AuditProgressChart = dynamic(() => import("@/components/dashboard/analytics/audit-progress-chart").then(mod => mod.AuditProgressChart), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const AssetUsageCharts = dynamic(() => import("@/components/dashboard/analytics/asset-usage-charts").then(mod => mod.AssetUsageCharts), { loading: () => <Skeleton className="h-[300px] w-full" /> });
const GrowthMetricsCharts = dynamic(() => import("@/components/dashboard/analytics/growth-metrics-charts").then(mod => mod.GrowthMetricsCharts), { loading: () => <Skeleton className="h-[300px] w-full" /> });

export const metadata: Metadata = {
  title: "Analytics | AssetFlow",
  description: "AssetFlow Analytics Dashboard",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ChartIcon className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights and metrics for your organization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AssetStatusChart />
        <AuditProgressChart />
        <MaintenanceTrendChart />
      </div>

      <DepartmentUtilizationChart />

      <AssetUsageCharts />

      <BookingTrendChart />

      <GrowthMetricsCharts />
    </div>
  );
}
