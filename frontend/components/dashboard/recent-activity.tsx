"use client";

import { useRecentActivity } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeftRight, 
  Wrench, 
  ClipboardCheck, 
  Package, 
  Box,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";

export function RecentActivity() {
  const { data: activities, isLoading, isError } = useRecentActivity();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !activities) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg text-muted-foreground">
            Failed to load recent activity.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "ALLOCATION": return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
      case "RETURN": return <RotateCcw className="h-4 w-4 text-emerald-500" />;
      case "MAINTENANCE": return <Wrench className="h-4 w-4 text-amber-500" />;
      case "AUDIT": return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case "REGISTRATION": return <Package className="h-4 w-4 text-indigo-500" />;
      default: return <Box className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "ALLOCATION": return "bg-purple-500/10 border-purple-500/20";
      case "RETURN": return "bg-emerald-500/10 border-emerald-500/20";
      case "MAINTENANCE": return "bg-amber-500/10 border-amber-500/20";
      case "AUDIT": return "bg-blue-500/10 border-blue-500/20";
      case "REGISTRATION": return "bg-indigo-500/10 border-indigo-500/20";
      default: return "bg-muted border-border";
    }
  };

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your organization</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Box className="h-8 w-8 mb-3 opacity-20" />
            <p>No recent activity found.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {activities.map((activity, index) => (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background z-10 shadow-sm md:mx-auto md:absolute md:left-1/2 md:-translate-x-1/2 flex-shrink-0">
                  {getIcon(activity.type)}
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border rounded-xl p-4 shadow-sm bg-card transition-colors hover:bg-muted/30 ml-4 md:ml-0 group-hover:border-primary/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{activity.userName}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description} <span className="font-medium text-foreground">{activity.assetName}</span>
                  </p>
                  {activity.status && (
                    <div className="mt-2">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getBgColor(activity.type)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
