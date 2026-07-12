"use client";

import { DashboardSummary } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  CheckCircle2, 
  ArrowLeftRight, 
  Wrench, 
  TrendingUp, 
  TrendingDown,
  Minus
} from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardsProps {
  summary: DashboardSummary;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const kpis = [
    {
      title: "Total Assets",
      value: summary.totalAssets,
      trend: summary.totalAssetsTrend,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Available Assets",
      value: summary.availableAssets,
      trend: summary.availableAssetsTrend,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Allocated Assets",
      value: summary.allocatedAssets,
      trend: summary.allocatedAssetsTrend,
      icon: ArrowLeftRight,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Maintenance Today",
      value: summary.maintenanceToday,
      trend: 0, // usually flat or specific logic
      icon: Wrench,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpis.map((kpi, idx) => {
        const TrendIcon = kpi.trend > 0 ? TrendingUp : kpi.trend < 0 ? TrendingDown : Minus;
        const trendColor = kpi.trend > 0 ? "text-emerald-500" : kpi.trend < 0 ? "text-destructive" : "text-muted-foreground";
        
        return (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-border/50 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg} transition-transform group-hover:scale-110 duration-300`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {kpi.value.toLocaleString()}
                </div>
                <div className="flex items-center mt-1 space-x-1">
                  <div className={`flex items-center text-xs font-medium ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {Math.abs(kpi.trend)}%
                  </div>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
