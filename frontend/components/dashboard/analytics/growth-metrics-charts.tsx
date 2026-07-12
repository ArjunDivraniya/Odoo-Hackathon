"use client";

import { useMonthlyGrowth, useYearlyGrowth } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusableAreaChart } from "@/components/charts/reusable-area-chart";
import { ReusableLineChart } from "@/components/charts/reusable-line-chart";

export function GrowthMetricsCharts() {
  const { data: monthly, isLoading: loadingMonthly, isError: errorMonthly } = useMonthlyGrowth();
  const { data: yearly, isLoading: loadingYearly, isError: errorYearly } = useYearlyGrowth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard 
        title="Monthly Asset Growth" 
        description="Asset acquisition and disposal over past 12 months"
        isLoading={loadingMonthly}
        isError={errorMonthly}
        isEmpty={!monthly || monthly.length === 0}
        contentClassName="h-[350px]"
      >
        <ReusableAreaChart 
          data={monthly || []} 
          xAxisKey="date"
          areas={[
            { key: "value", name: "Total Assets", color: "#10b981" },
            { key: "secondaryValue", name: "Net Additions", color: "#6366f1" },
          ]}
          showLegend
        />
      </ChartCard>

      <ChartCard 
        title="Yearly Growth Trend" 
        description="Long-term growth trajectory"
        isLoading={loadingYearly}
        isError={errorYearly}
        isEmpty={!yearly || yearly.length === 0}
        contentClassName="h-[350px]"
      >
        <ReusableLineChart 
          data={yearly || []} 
          xAxisKey="date"
          lines={[
            { key: "value", name: "Total Assets", color: "#8b5cf6" },
          ]}
          showLegend
        />
      </ChartCard>
    </div>
  );
}
