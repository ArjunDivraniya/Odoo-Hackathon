"use client";

import { usePendingTasks } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function PendingTasks() {
  const { data: tasks, isLoading, isError } = usePendingTasks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between border-b pb-4 last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !tasks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-muted-foreground">
            Unable to load tasks.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200">High</Badge>;
      case "MEDIUM":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">Medium</Badge>;
      case "LOW":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "APPROVAL": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "MAINTENANCE": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Action Items</CardTitle>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, idx) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{getTypeIcon(task.type)}</div>
                  <div>
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                    <div className="flex items-center text-[10px] font-medium text-muted-foreground mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  {getPriorityBadge(task.priority)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
