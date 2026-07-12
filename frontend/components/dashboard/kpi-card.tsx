"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  isLoading?: boolean;
}

export function KPICard({ title, value, icon, trend, trendLabel, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderTrend = () => {
    if (trend === undefined) return null;
    
    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const isNeutral = trend === 0;

    return (
      <div className={`flex items-center text-xs mt-1 font-medium ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'}`}>
        {isPositive && <ArrowUpRight className="mr-1 h-3 w-3" />}
        {isNegative && <ArrowDownRight className="mr-1 h-3 w-3" />}
        {isNeutral && <Minus className="mr-1 h-3 w-3" />}
        {Math.abs(trend)}% {trendLabel && <span className="text-muted-foreground font-normal ml-1">{trendLabel}</span>}
      </div>
    );
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            <div className="text-muted-foreground h-4 w-4">
              {icon}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{value}</div>
            {renderTrend()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
