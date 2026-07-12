"use client";

import { useMaintenanceTrend } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusableAreaChart } from "@/components/charts/reusable-area-chart";

export function MaintenanceTrendChart() {
  const { data, isLoading, isError } = useMaintenanceTrend();

  return (
    <ChartCard 
      title="Maintenance Requests" 
      description="Volume of maintenance tickets over time"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      contentClassName="h-[300px]"
    >
      <ReusableAreaChart 
        data={data || []} 
        xAxisKey="date"
        areas={[
          { key: "value", name: "Requests", color: "#f59e0b" },
        ]}
        showLegend={false}
      />
    </ChartCard>
  );
}
