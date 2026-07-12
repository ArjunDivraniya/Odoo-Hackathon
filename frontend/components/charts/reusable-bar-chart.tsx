"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface ReusableBarChartProps {
  data: any[];
  xAxisKey: string;
  bars: {
    key: string;
    name?: string;
    color: string | ((entry: any, index: number) => string); // Can be a static string or a function for dynamic coloring
  }[];
  layout?: "horizontal" | "vertical";
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
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }} />
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

export function ReusableBarChart({
  data,
  xAxisKey,
  bars,
  layout = "horizontal",
  showGrid = true,
  showLegend = false,
  stacked = false,
}: ReusableBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        layout={layout}
        margin={{ top: 10, right: 10, left: layout === "vertical" ? 0 : -20, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={layout === "horizontal" ? false : true} 
            horizontal={layout === "horizontal" ? true : false}
            stroke="hsl(var(--muted-foreground)/0.2)" 
          />
        )}
        
        {layout === "horizontal" ? (
          <>
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          </>
        ) : (
          <>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={xAxisKey} type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10} width={100} />
          </>
        )}
        
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted-foreground)/0.1)' }} />
        {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />}
        
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name || bar.key}
            stackId={stacked ? "stack" : undefined}
            radius={stacked ? [0, 0, 0, 0] : layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            fill={typeof bar.color === 'string' ? bar.color : undefined}
          >
            {typeof bar.color === 'function' && data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(bar.color as Function)(entry, index)} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
