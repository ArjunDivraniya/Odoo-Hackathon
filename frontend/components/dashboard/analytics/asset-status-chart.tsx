"use client";

import { useAssetStatus } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusablePieChart } from "@/components/charts/reusable-pie-chart";

export function AssetStatusChart() {
  const { data, isLoading, isError } = useAssetStatus();

  return (
    <ChartCard 
      title="Asset Status Overview" 
      description="Current distribution of all assets"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      contentClassName="h-[300px]"
    >
      <ReusablePieChart data={data || []} innerRadius="60%" legendPosition="right" />
    </ChartCard>
  );
}
