"use client";

import { useBookingTrend } from "@/hooks/use-dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { ReusableLineChart } from "@/components/charts/reusable-line-chart";

export function BookingTrendChart() {
  const { data, isLoading, isError } = useBookingTrend();

  return (
    <ChartCard 
      title="Resource Bookings" 
      description="Daily booking volume"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data || data.length === 0}
      contentClassName="h-[300px]"
    >
      <ReusableLineChart 
        data={data || []} 
        xAxisKey="date"
        lines={[
          { key: "value", name: "Bookings", color: "#8b5cf6" },
        ]}
        showLegend={false}
      />
    </ChartCard>
  );
}
