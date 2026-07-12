"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ReusableAreaChartProps {
  data: any[];
  xAxisKey: string;
  areas: {
    key: string;
    name?: string;
    color: string;
  }[];
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-md rounded-lg p-3 text-sm min-w-[120px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-medium text-foreground">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ReusableAreaChart({
  data,
  xAxisKey,
  areas,
  showGrid = true,
  showLegend = true,
  stacked = false,
}: ReusableAreaChartProps) {
  // Generate unique IDs for gradients
  const gradientIds = areas.reduce((acc, area) => {
    acc[area.key] = `color-${area.key.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={area.key} id={gradientIds[area.key]} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
        )}
        
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
        />
        
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />}
        
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.name || area.key}
            stroke={area.color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientIds[area.key]})`}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
