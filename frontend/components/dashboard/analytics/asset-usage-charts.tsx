"use client";

import { useMostUsedAssets, useIdleAssets } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusableBarChart } from "@/components/charts/reusable-bar-chart";

export function AssetUsageCharts() {
  const { data: mostUsed, isLoading: loadingMost, isError: errorMost } = useMostUsedAssets();
  const { data: idle, isLoading: loadingIdle, isError: errorIdle } = useIdleAssets();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard 
        title="Most Used Assets" 
        description="Top assets by utilization frequency"
        isLoading={loadingMost}
        isError={errorMost}
        isEmpty={!mostUsed || mostUsed.length === 0}
        contentClassName="h-[300px]"
      >
        <ReusableBarChart 
          data={mostUsed || []} 
          xAxisKey="assetName"
          layout="vertical"
          bars={[
            { key: "usageCount", name: "Usage Count", color: "#3b82f6" },
          ]}
        />
      </ChartCard>

      <ChartCard 
        title="Idle Assets" 
        description="Assets with lowest utilization frequency"
        isLoading={loadingIdle}
        isError={errorIdle}
        isEmpty={!idle || idle.length === 0}
        contentClassName="h-[300px]"
      >
        <ReusableBarChart 
          data={idle || []} 
          xAxisKey="assetName"
          layout="vertical"
          bars={[
            { key: "usageCount", name: "Usage Count", color: "#f43f5e" },
          ]}
        />
      </ChartCard>
    </div>
  );
}
