"use client";

import { useAuditProgress } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusablePieChart } from "@/components/charts/reusable-pie-chart";

export function AuditProgressChart() {
  const { data, isLoading, isError } = useAuditProgress();

  return (
    <ChartCard 
      title="Current Audit Progress" 
      description="Status of the ongoing quarterly audit"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      contentClassName="h-[300px]"
    >
      <ReusablePieChart 
        data={data || []} 
        innerRadius="0%" 
        outerRadius="80%"
        legendPosition="bottom" 
      />
    </ChartCard>
  );
}
