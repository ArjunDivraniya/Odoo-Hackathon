"use client";

import { Activity, Bell, FileText, PackageX, CalendarClock, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Timeline, TimelineItem } from "@/components/ui/timeline-component";
import { NotificationItem } from "@/components/ui/notification-component";
import { TaskItem } from "@/components/ui/task-component";
import { ActivitySkeleton } from "@/components/dashboard/activity/activity-skeleton";
import { 
  usePendingApprovals, 
  useUpcomingReturns, 
  useOverdueAssets, 
  useMaintenanceRequests, 
  useTransferRequests 
} from "@/hooks/use-activity";
import { useDashboardNotifications, useRecentActivity } from "@/hooks/use-dashboard";
import { format } from "date-fns";

export default function ActivityCenterPage() {
  const { data: approvals, isLoading: loadingApprovals } = usePendingApprovals();
  const { data: returns, isLoading: loadingReturns } = useUpcomingReturns();
  const { data: overdues, isLoading: loadingOverdues } = useOverdueAssets();
  const { data: maintenance, isLoading: loadingMaint } = useMaintenanceRequests();
  const { data: transfers, isLoading: loadingTransfers } = useTransferRequests();
  const { data: activityLog, isLoading: loadingActivity } = useRecentActivity();
  const { data: notifications, isLoading: loadingNotifs } = useDashboardNotifications();

  const isLoading = loadingApprovals || loadingReturns || loadingOverdues || loadingMaint || loadingTransfers || loadingActivity || loadingNotifs;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Activity Center</h2>
        <ActivitySkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Activity Center
        </h2>
        <p className="text-muted-foreground">
          Track pending actions, urgent alerts, and recent organizational activity.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Actionable Tasks */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Pending Approvals */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <CardTitle>Pending Approvals</CardTitle>
              </div>
              <CardDescription>Requests awaiting your authorization.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {approvals?.length ? approvals.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  metadata={`Requester: ${task.requester}`}
                  date={task.date}
                  onApprove={(id) => console.log("Approve", id)}
                  onReject={(id) => console.log("Reject", id)}
                />
              )) : (
                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                  No pending approvals.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfers & Maintenance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                  <CardTitle>Transfer Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {transfers?.length ? transfers.map((t) => (
                  <TaskItem
                    key={t.id}
                    id={t.id}
                    title={t.assetName}
                    description={`Transfer to ${t.to}`}
                    date={t.date}
                    onApprove={(id) => console.log("Approve transfer", id)}
                  />
                )) : (
                  <div className="text-center p-4 text-sm border border-dashed rounded-lg text-muted-foreground">
                    No active transfers.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <PackageX className="h-5 w-5 text-red-500" />
                  <CardTitle>Overdue Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {overdues?.length ? overdues.map((o) => (
                  <TaskItem
                    key={o.id}
                    id={o.id}
                    title={o.assetName}
                    description={`Assigned to ${o.assigneeName}`}
                    priority="CRITICAL"
                    date={o.returnDate}
                  />
                )) : (
                  <div className="text-center p-4 text-sm border border-dashed rounded-lg text-muted-foreground">
                    No overdue assets! 🎉
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Returns */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-emerald-500" />
                <CardTitle>Upcoming Returns</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {returns?.length ? returns.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{r.assetName}</p>
                    <p className="text-xs text-muted-foreground">Assignee: {r.assigneeName}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">
                    Due: {format(new Date(r.returnDate), "MMM d")}
                  </span>
                </div>
              )) : (
                <div className="text-center p-4 text-sm border border-dashed rounded-lg text-muted-foreground">
                  No upcoming returns this week.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Timeline & Notifications */}
        <div className="space-y-8">
          
          {/* Notifications */}
          <Card className="shadow-md border-primary/10">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                {notifications?.some(n => !n.read) && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 max-h-[400px] overflow-y-auto">
              {notifications?.length ? notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  message={n.message}
                  timestamp={n.timestamp}
                  isRead={n.read}
                  onMarkRead={(id) => console.log("Marking read", id)}
                />
              )) : (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  You're all caught up!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-6">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLog?.length ? (
                <Timeline>
                  {activityLog.map((log, i) => (
                    <TimelineItem
                      key={log.id}
                      id={log.id}
                      title={log.type.replace(/_/g, " ")}
                      description={log.description}
                      timestamp={log.timestamp}
                      status={log.type === "ALLOCATION" ? "success" : log.type === "MAINTENANCE" ? "warning" : "default"}
                      isLast={i === activityLog.length - 1}
                      icon={<Activity className="h-4 w-4" />}
                    />
                  ))}
                </Timeline>
              ) : (
                <div className="text-center p-4 text-sm border border-dashed rounded-lg text-muted-foreground">
                  No recent activity found.
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>

      </div>
    </div>
  );
}
