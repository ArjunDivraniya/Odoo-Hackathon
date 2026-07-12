"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface ReusablePieChartProps {
  data: DataItem[];
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLegend?: boolean;
  legendPosition?: "top" | "right" | "bottom" | "left";
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border shadow-md rounded-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-1">{data.name}</p>
        <p className="text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
          {data.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function ReusablePieChart({ 
  data, 
  innerRadius = "60%", 
  outerRadius = "80%",
  showLegend = true,
  legendPosition = "bottom"
}: ReusablePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend 
            verticalAlign={legendPosition === "right" || legendPosition === "left" ? "middle" : legendPosition}
            align={legendPosition === "right" ? "right" : legendPosition === "left" ? "left" : "center"}
            layout={legendPosition === "right" || legendPosition === "left" ? "vertical" : "horizontal"}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
