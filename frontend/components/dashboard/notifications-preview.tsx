"use client";

import { useDashboardNotifications } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Bell, Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotificationsPreview() {
  const { data: notifications, isLoading, isError } = useDashboardNotifications();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !notifications) {
    return null; // Fail silently for this preview widget, or show simple error
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
      case "SUCCESS": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "WARNING": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ALERT": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alerts
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No new notifications
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.slice(0, 4).map((notification, idx) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex gap-3 p-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50 ${!notification.read ? "bg-muted/30" : ""}`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div>
                  <h4 className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>
                    {notification.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <Button variant="ghost" className="w-full mt-4 text-xs h-8 text-primary" asChild>
            <Link href="/dashboard/notifications">View all alerts</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
