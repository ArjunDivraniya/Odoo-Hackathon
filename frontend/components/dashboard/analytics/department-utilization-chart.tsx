"use client";

import { useDepartmentUtilization } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusableBarChart } from "@/components/charts/reusable-bar-chart";

export function DepartmentUtilizationChart() {
  const { data, isLoading, isError } = useDepartmentUtilization();

  return (
    <ChartCard 
      title="Department Utilization" 
      description="Asset usage across departments"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      contentClassName="h-[350px]"
    >
      <ReusableBarChart 
        data={data || []} 
        xAxisKey="department"
        bars={[
          { key: "utilized", name: "Utilized", color: "#3b82f6" },
          { key: "total", name: "Total Assigned", color: "hsl(var(--muted))" },
        ]}
        showLegend
      />
    </ChartCard>
  );
}
